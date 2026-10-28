import { existsSync, promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import path from 'pathe'
import prompts from 'prompts'
import { z } from 'zod'
import { BASE_DEPENDENCIES, BASE_DEV_DEPENDENCIES, iconLibrary, ICON_LIBRARIES } from '@/src/constants'
import { compileStylesheet, defaultBrand, ensureImport, installFonts } from '@/src/library'
import { preFlightInit } from '@/src/preflights/preflight-init'
import { rawConfigSchema, type Config, type RawConfig } from '@/src/schema'
import { createProject } from '@/src/utils/create-project'
import * as ERRORS from '@/src/utils/errors'
import { CONFIG_FILE, getRawConfig, resolveConfigPaths } from '@/src/utils/get-config'
import { getPackageInfo } from '@/src/utils/get-package-info'
import { getProjectInfo, projectConfig } from '@/src/utils/get-project-info'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { updateDependencies } from '@/src/utils/updaters/update-dependencies'

export const initOptionsSchema = z.object({
  cwd: z.string(),
  library: z.string().optional(),
  iconLibrary: z.string().optional(),
  template: z.string().optional(),
  name: z.string().optional(),
  yes: z.boolean(),
  defaults: z.boolean(),
  force: z.boolean(),
  silent: z.boolean(),
})

export type InitOptions = z.infer<typeof initOptionsSchema>

export interface InitReport {
  config: Config
  /** Files written, relative to the project. */
  written: string[]
  /** Files that already existed and were left alone. */
  kept: string[]
}

// Vue's SFC compiler reads an item's imported types through TypeScript and cannot use TypeScript 7 yet.
const TYPESCRIPT = 'typescript@^6'
const hasTypescript = (cwd: string) => {
  const pkg = getPackageInfo(cwd, false)
  return Boolean(pkg?.dependencies?.typescript || pkg?.devDependencies?.typescript)
}

const DESIGN_SECTIONS = ['Overview', 'Colors', 'Typography', 'Layout', 'Elevation & Depth', 'Shapes', 'Components', "Do's and Don'ts"]
const DESIGN_BODY = DESIGN_SECTIONS.map((section) => `## ${section}\n`).join('\n')

export const AGENTS_FILE = 'AGENTS.md'

// The bundle ships AGENTS.md beside dist/index.js; from source the package's content/ copy is used.
const agentsSources = [new URL('./AGENTS.md', import.meta.url), new URL('../../content/AGENTS.md', import.meta.url)]

/** Where AGENTS.md goes: the components folder, and the ui folder too when it lies outside it. */
export function agentsFolders(config: Config) {
  const { components, ui } = config.resolvedPaths
  const fromComponents = path.relative(components, ui)
  return fromComponents.startsWith('..') || path.isAbsolute(fromComponents) ? [components, ui] : [components]
}

/** The packaged AGENTS.md with its library folder and barrel import rewritten to the project's. */
export async function agentsText(config: Config) {
  const source = agentsSources.map((url) => fileURLToPath(url)).find((file) => existsSync(file))
  if (!source) throw new Error(`${AGENTS_FILE} is missing from this @frontic/ui install`)
  const library = path.relative(config.resolvedPaths.cwd, config.resolvedPaths.library)
  return (await fs.readFile(source, 'utf8')).replaceAll('`library/', `\`${library}/`).replaceAll("'@/components/ui/", `'${config.aliases.ui}/`)
}

/** What `init` prints when it is done: the next command, and the root ConfigProvider the items read their direction, locale and overlay target from. */
export function initDoneMessage() {
  return [
    `${highlighter.success('Success!')} Frontic UI initialized.`,
    `Wrap your app root in Reka's ConfigProvider; the items take their reading direction, locale and overlay target from it:`,
    highlighter.info(`  <ConfigProvider dir="ltr" locale="en-US">\n    <!-- your app -->\n  </ConfigProvider>`),
    `Add an item with: ${highlighter.info('npx @frontic/ui add button')}`,
  ].join('\n')
}

export const init = new Command()
  .name('init')
  .description('write components.json, library/ and the components folder\'s AGENTS.md, compile frontic.css and add its import')
  .option('--library <path>', 'where brand.json, DESIGN.md and recipes/, the shared recipes, live. (library)')
  .option('--icon-library <name>', `the icon library. (${ICON_LIBRARIES.map((library) => library.name).join(', ')})`)
  .option('-t, --template <template>', 'project template when there is no package.json. (nuxt, vite, vite-router)')
  .option('-y, --yes', 'skip confirmation prompt.', true)
  .option('-d, --defaults', 'use default configuration.', false)
  .option('-f, --force', 'overwrite an existing components.json.', false)
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('-s, --silent', 'mute output.', false)
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse({ ...opts, cwd: path.resolve(opts.cwd) })
      await runInit(options)
      logger.log(initDoneMessage())
      logger.break()
    } catch (error) {
      logger.break()
      handleError(error)
    }
  })

/** The icon library and the global CSS path, asked on a terminal unless --defaults, starting from `detected`. */
async function promptConfig(detected: RawConfig, options: InitOptions): Promise<RawConfig> {
  if (options.defaults || !process.stdin.isTTY) return detected
  const answers = await prompts([
    {
      type: options.iconLibrary ? null : 'select',
      name: 'iconLibrary',
      message: `Which ${highlighter.info('icon library')} would you like to use?`,
      choices: ICON_LIBRARIES.map((library) => ({ title: library.label, value: library.name })),
      initial: Math.max(0, ICON_LIBRARIES.findIndex((library) => library.name === detected.iconLibrary)),
    },
    {
      type: 'text',
      name: 'css',
      message: `Where is your ${highlighter.info('global CSS')} file?`,
      initial: detected.tailwind.css,
      format: (value: string) => value.trim(),
      validate: (value: string) => (value.trim() ? true : 'The path cannot be empty.'),
    },
  ])
  if (!answers.css) {
    logger.break()
    process.exit(1)
  }
  return { ...detected, iconLibrary: answers.iconLibrary ?? detected.iconLibrary, tailwind: { css: answers.css } }
}

/** Writes components.json and the library, installs the base packages, compiles frontic.css and adds its import. */
export async function runInit(options: InitOptions & { skipPreflight?: boolean }): Promise<InitReport> {
  if (!options.skipPreflight) {
    const preflight = await preFlightInit(options)
    if (preflight.errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT]) {
      const { projectPath } = await createProject(options)
      options.cwd = projectPath
    }
  }
  const cwd = options.cwd
  const relative = (file: string) => path.relative(cwd, file)
  const written: string[] = []
  const kept: string[] = []

  const projectInfo = await getProjectInfo(cwd)
  const detected = projectConfig(projectInfo)
  if (!detected) throw new Error(`No Tailwind CSS file or import alias found at ${cwd}.`)
  // What the project chose before outranks detection, so --force does not reset it; a file --force cannot read is rewritten from detection.
  const existing = await getRawConfig(cwd).catch((error: Error) => {
    if (!options.force) throw error
    logger.warn(`${CONFIG_FILE} could not be read and is written again: ${error.message}`)
    return null
  })
  const current = existing ? { ...detected, tailwind: existing.tailwind, iconLibrary: existing.iconLibrary, aliases: existing.aliases, library: existing.library } : detected
  const library = iconLibrary(options.iconLibrary ?? current.iconLibrary)
  if (!library) throw new Error(`Unknown icon library ${options.iconLibrary}; one of ${ICON_LIBRARIES.map((entry) => entry.name).join(', ')}.`)
  const answered = await promptConfig({ ...current, iconLibrary: library.name, library: options.library ?? current.library }, options)
  const raw = rawConfigSchema.parse(answered)
  const icons = iconLibrary(raw.iconLibrary)!

  const configPath = path.resolve(cwd, CONFIG_FILE)
  if (existsSync(configPath) && !options.force) throw new Error(`A components.json file already exists at ${cwd}. Run init --force to write it again.`)
  await fs.writeFile(configPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
  written.push(CONFIG_FILE)
  const config = await resolveConfigPaths(cwd, raw)

  await fs.mkdir(config.resolvedPaths.library, { recursive: true })
  const agents = await agentsText(config)
  for (const folder of agentsFolders(config)) await fs.mkdir(folder, { recursive: true })
  for (const [file, content] of [
    [config.resolvedPaths.brand, defaultBrand()],
    [config.resolvedPaths.design, DESIGN_BODY],
    ...agentsFolders(config).map((folder) => [path.join(folder, AGENTS_FILE), agents] as const),
  ] as const) {
    if (existsSync(file)) {
      kept.push(relative(file))
      continue
    }
    await fs.writeFile(file, content, 'utf8')
    written.push(relative(file))
  }
  const recipes = `${relative(config.resolvedPaths.recipes)}/`
  if (existsSync(config.resolvedPaths.recipes)) kept.push(recipes)
  else {
    await fs.mkdir(config.resolvedPaths.recipes, { recursive: true })
    written.push(recipes)
  }

  await updateDependencies([...BASE_DEPENDENCIES, ...icons.packages], config, { silent: options.silent })
  await updateDependencies([...BASE_DEV_DEPENDENCIES, ...(hasTypescript(cwd) ? [] : [TYPESCRIPT])], config, { silent: options.silent, dev: true })
  await installFonts(config, { silent: options.silent })
  const stylesheet = await compileStylesheet(config)
  if (stylesheet.written) written.push(relative(stylesheet.path))
  if (await ensureImport(config)) written.push(relative(config.resolvedPaths.tailwindCss))

  if (!options.silent) {
    logger.break()
    for (const file of written) logger.info(`Wrote ${file}`)
    for (const file of kept) logger.info(`Kept ${file}`)
    for (const warning of stylesheet.warnings) logger.warn(warning)
    logger.break()
  }
  return { config, written, kept }
}

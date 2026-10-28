import { existsSync, promises as fs } from 'node:fs'
import { addDependency, detectPackageManager, type PackageManagerName } from 'nypm'
import path from 'pathe'
import prompts from 'prompts'
import { x } from 'tinyexec'
import type { InitOptions } from '@/src/commands/init'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { spinner } from '@/src/utils/spinner'
import { skipInstall } from '@/src/utils/updaters/update-dependencies'

export const TEMPLATES = {
  'nuxt': 'nuxt',
  'vite': 'vite',
  'vite-router': 'vite-router',
} as const

const TAILWIND_PACKAGES = ['tailwindcss', '@tailwindcss/vite']
const TAILWIND_CSS = '@import "tailwindcss";\n'
const VITE_APP = '<template>\n  <main />\n</template>\n'
/** The vue-ts template's demo: its unstyled classes would fail `check` in a fresh project. */
const VITE_DEMO_FILES = ['src/style.css', 'src/components/HelloWorld.vue', 'src/assets/hero.png', 'src/assets/vite.svg', 'src/assets/vue.svg', 'public/icons.svg']

export async function createProject(options: Pick<InitOptions, 'cwd' | 'force' | 'name' | 'template'>) {
  let templateKey: string = options.template || 'nuxt'
  let projectName: string = options.name || 'my-app'

  if (!options.force && !process.stdin.isTTY && !options.template) throw new Error(`--template is required without a terminal. Available templates: ${Object.keys(TEMPLATES).join(', ')}`)

  if (!options.force && process.stdin.isTTY) {
    const { type, name } = await prompts([
      {
        type: options.template ? null : 'select',
        name: 'type',
        message: `The path ${highlighter.info(options.cwd)} does not contain a package.json file.\n  Would you like to start a new project?`,
        choices: [
          { title: 'Nuxt', value: 'nuxt' },
          { title: 'Vite', value: 'vite' },
          { title: 'Vite + Vue Router', value: 'vite-router' },
        ],
        initial: 0,
      },
      {
        type: options.name ? null : 'text',
        name: 'name',
        message: 'What is your project named?',
        initial: projectName,
        format: (value: string) => value.trim(),
        validate: (value: string) => (value.length > 128 ? `Name should be less than 128 characters.` : true),
      },
    ])

    templateKey = type ?? templateKey
    projectName = name ?? projectName
  }

  const packageManager = await detectPackageManager(options.cwd)
  const pmName = packageManager?.name || 'npm'

  const projectPath = `${options.cwd}/${projectName}`

  // Check if path is writable.
  try {
    await fs.access(options.cwd, fs.constants.W_OK)
  } catch {
    logger.break()
    logger.error(`The path ${highlighter.info(options.cwd)} is not writable.`)
    logger.error(`It is likely you do not have write permissions for this folder or the path ${highlighter.info(options.cwd)} does not exist.`)
    logger.break()
    process.exit(1)
  }

  if (existsSync(path.resolve(options.cwd, projectName, 'package.json'))) {
    logger.break()
    logger.error(`A project with the name ${highlighter.info(projectName)} already exists.`)
    logger.error(`Please choose a different name and try again.`)
    logger.break()
    process.exit(1)
  }

  if (templateKey === TEMPLATES.nuxt) {
    await createNuxtProject(projectPath, { packageManager: pmName })
  } else if (templateKey === TEMPLATES.vite) {
    await createViteProject(projectPath, { packageManager: pmName, router: false })
  } else if (templateKey === TEMPLATES['vite-router']) {
    await createViteProject(projectPath, { packageManager: pmName, router: true })
  } else {
    logger.break()
    logger.error(`Unknown template: ${highlighter.info(templateKey)}`)
    logger.error(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`)
    logger.break()
    process.exit(1)
  }

  return {
    projectPath,
    projectName,
    template: templateKey,
  }
}

/** Puts `import tailwindcss from '@tailwindcss/vite'` first, registers the plugin after vue() and aliases `@` to src/. */
export function addTailwindToViteConfig(source: string): string {
  const plugins = 'plugins: [vue()],'
  if (!source.includes(plugins)) throw new Error(`no \`${plugins}\` found`)
  const config = source.replace(plugins, `${plugins}\n  resolve: {\n    alias: {\n      '@': fileURLToPath(new URL('./src', import.meta.url)),\n    },\n  },`).replace(plugins, 'plugins: [vue(), tailwindcss()],')
  return `import tailwindcss from '@tailwindcss/vite'\nimport { fileURLToPath, URL } from 'node:url'\n${config}`
}

/** Adds `paths: { "@/*": ["./src/*"] }` to compilerOptions, creating compilerOptions when the file has none. Comments and the rest of the file stay as they are. */
export function addAliasToTsconfig(source: string): string {
  if (source.includes('"paths"')) throw new Error('`paths` is already set')
  const paths = '"paths": { "@/*": ["./src/*"] }'
  const compilerOptions = '"compilerOptions": {'
  if (source.includes(compilerOptions)) return source.replace(compilerOptions, `${compilerOptions}\n    ${paths},`)
  const open = source.indexOf('{')
  if (open === -1) throw new Error('no `{` found')
  return `${source.slice(0, open + 1)}\n  "compilerOptions": { ${paths} },${source.slice(open + 1)}`
}

/** Imports src/assets/css/tailwind.css where the template imported its own stylesheet. */
export function importTailwindInMain(source: string): string {
  const stylesheet = "import './style.css'"
  if (!source.includes(stylesheet)) throw new Error(`no \`${stylesheet}\` found`)
  return source.replace(stylesheet, "import './assets/css/tailwind.css'")
}

/** Puts `import tailwindcss from '@tailwindcss/vite'` first and lists the stylesheet and the plugin at the top of the config. */
export function addTailwindToNuxtConfig(source: string): string {
  const open = 'defineNuxtConfig({'
  if (!source.includes(open)) throw new Error(`no \`${open}\` found`)
  return `import tailwindcss from '@tailwindcss/vite'\n\n${source.replace(open, `${open}\n  css: ['~/assets/css/tailwind.css'],\n  vite: { plugins: [tailwindcss()] },`)}`
}

/** Rewrites a generated file with the transform; a transform that misses its anchor fails naming the file. */
async function editFile(file: string, transform: (source: string) => string) {
  let source: string
  try {
    source = await fs.readFile(file, 'utf8')
  } catch (error) {
    throw new Error(`Could not read ${file}: the scaffold did not write it.`, { cause: error })
  }
  let next: string
  try {
    next = transform(source)
  } catch (error) {
    throw new Error(`Could not update ${file}: ${(error as Error).message}. The generator's output has changed; set it up by hand.`, { cause: error })
  }
  await fs.writeFile(file, next, 'utf8')
}

/** Installs the packages with the named package manager, since a fresh scaffold has no lockfile to detect one by; with FRONTIC_SKIP_INSTALL=1 it prints what it would install instead. */
async function addPackages(cwd: string, packages: string[], options: { packageManager: PackageManagerName; dev: boolean }) {
  if (skipInstall()) {
    logger.info(`Would install${options.dev ? ' (dev)' : ''}: ${packages.join(', ')}`)
    return
  }
  await addDependency(packages, { cwd, packageManager: options.packageManager, dev: options.dev, silent: true })
}

/** Runs the command and throws on a non-zero exit, so a failed generator is reported instead of being finished. */
const run = (command: string, args: string[], cwd: string) => x(command, args, { nodeOptions: { cwd }, throwOnError: true })

async function gitInit(projectPath: string) {
  try {
    await run('git', ['init'], projectPath)
  } catch {
    // Git init is optional - ignore errors.
  }
}

/** Scaffolds the minimal Nuxt template, installs Tailwind v4 with the Vite plugin and typescript, and makes sure .nuxt/ carries the import alias. */
async function createNuxtProject(projectPath: string, options: { packageManager: PackageManagerName }) {
  const createSpinner = spinner(`Creating a new Nuxt project. This may take a few minutes.`).start()

  try {
    await run('npx', ['nuxi', 'init', path.basename(projectPath), '--template', 'minimal', '--packageManager', options.packageManager, '--no-gitInit', '--no-install'], path.dirname(projectPath))
    await editFile(path.join(projectPath, 'nuxt.config.ts'), addTailwindToNuxtConfig)
    // Nuxt 4 reads the app from app/; without that directory the template is the Nuxt 3 layout rooted at the project.
    const srcDir = existsSync(path.join(projectPath, 'app')) ? path.join(projectPath, 'app') : projectPath
    await fs.mkdir(path.join(srcDir, 'assets/css'), { recursive: true })
    await fs.writeFile(path.join(srcDir, 'assets/css/tailwind.css'), TAILWIND_CSS, 'utf8')
    // The Vue compiler resolves the prop types the items import through typescript 6; the Nuxt template installs none, and 7 lacks the API it reads.
    await addPackages(projectPath, [...TAILWIND_PACKAGES, 'typescript@^6'], { packageManager: options.packageManager, dev: true })
    // nuxt prepare writes the tsconfig with the alias; the template's postinstall runs it, but not every package manager runs postinstall on add.
    if (!skipInstall() && !existsSync(path.join(projectPath, '.nuxt/tsconfig.app.json')) && !existsSync(path.join(projectPath, '.nuxt/tsconfig.json'))) await run('npx', ['nuxt', 'prepare'], projectPath)
    await gitInit(projectPath)
  } catch (error) {
    createSpinner?.fail()
    throw error
  }

  createSpinner?.succeed('Creating a new Nuxt project.')
}

/** Scaffolds the vue-ts Vite template, installs Tailwind v4 with the Vite plugin and vue-router when asked, and aliases `@` to src/. */
async function createViteProject(projectPath: string, options: { packageManager: PackageManagerName; router: boolean }) {
  const label = options.router ? 'Vite + Vue Router' : 'Vite'
  const createSpinner = spinner(`Creating a new ${label} project. This may take a few minutes.`).start()

  try {
    // create-vite reads the target as a path under cwd, so it gets the name, not the absolute path.
    await run('npm', ['create', 'vite@latest', path.basename(projectPath), '--', '--template', 'vue-ts'], path.dirname(projectPath))
    await editFile(path.join(projectPath, 'vite.config.ts'), addTailwindToViteConfig)
    await editFile(path.join(projectPath, 'tsconfig.json'), addAliasToTsconfig)
    await editFile(path.join(projectPath, 'tsconfig.app.json'), addAliasToTsconfig)
    await editFile(path.join(projectPath, 'src/main.ts'), importTailwindInMain)
    await fs.mkdir(path.join(projectPath, 'src/assets/css'), { recursive: true })
    await fs.writeFile(path.join(projectPath, 'src/assets/css/tailwind.css'), TAILWIND_CSS, 'utf8')
    await Promise.all(VITE_DEMO_FILES.map(file => fs.rm(path.join(projectPath, file), { force: true })))
    await fs.writeFile(path.join(projectPath, 'src/App.vue'), VITE_APP, 'utf8')
    if (options.router) await addPackages(projectPath, ['vue-router'], { packageManager: options.packageManager, dev: false })
    await addPackages(projectPath, TAILWIND_PACKAGES, { packageManager: options.packageManager, dev: true })
    await gitInit(projectPath)
  } catch (error) {
    createSpinner?.fail()
    throw error
  }

  createSpinner?.succeed(`Creating a new ${label} project.`)
}

import { existsSync, promises as fs } from 'node:fs'
import { getTsconfig } from 'get-tsconfig'
import path from 'pathe'
import { configSchema, rawConfigSchema, type Config, type RawConfig } from '@/src/schema'
import { detectFrameworkConfigFiles, isTypeScriptProject } from '@/src/utils/get-project-info'
import { resolveImport } from '@/src/utils/resolve-import'
import { itemAlias } from '@/src/constants'

export type { Config, RawConfig }

export const CONFIG_FILE = 'components.json'

/** The project's config with its paths resolved; null without a components.json. */
export async function getConfig(cwd: string): Promise<Config | null> {
  const config = await getRawConfig(cwd)
  return config ? resolveConfigPaths(cwd, config) : null
}

/** components.json as written; null when the file is missing, an error naming the file when it does not parse. */
export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  const file = path.resolve(cwd, CONFIG_FILE)
  if (!existsSync(file)) return null
  let raw: unknown
  try {
    raw = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`${file} is not JSON: ${(error as Error).message}`, { cause: error })
  }
  const result = rawConfigSchema.safeParse(raw)
  if (!result.success) throw new Error(`${file}: ${result.error.issues.map((issue) => [issue.path.join('.'), issue.message].filter(Boolean).join(': ')).join('; ')}`)
  return result.data
}

async function tsconfigFor(cwd: string) {
  const framework = await detectFrameworkConfigFiles(cwd)
  const file = framework?.name === 'nuxt4' ? '.nuxt/tsconfig.app.json' : framework?.name === 'nuxt3' ? '.nuxt/tsconfig.json' : framework?.name === 'inertia' ? 'inertia/tsconfig.json' : (await isTypeScriptProject(cwd)) ? 'tsconfig.json' : 'jsconfig.json'
  return getTsconfig(path.resolve(cwd, file))
}

export async function resolveConfigPaths(cwd: string, config: RawConfig): Promise<Config> {
  const tsConfig = await tsconfigFor(cwd)
  if (tsConfig === null) throw new Error(`Failed to load ${config.typescript ? 'tsconfig' : 'jsconfig'}.json.`)
  const alias = (specifier: string | undefined, fallback: () => string) => (specifier && resolveImport(specifier, tsConfig)) || fallback()
  const components = alias(config.aliases.components, () => path.resolve(cwd, 'components'))
  const tailwindCss = path.resolve(cwd, config.tailwind.css)
  const library = path.resolve(cwd, config.library)
  return configSchema.parse({
    ...config,
    resolvedPaths: {
      cwd,
      tailwindCss,
      fronticCss: path.join(path.dirname(tailwindCss), 'frontic.css'),
      library,
      brand: path.join(library, 'brand.json'),
      design: path.join(library, 'DESIGN.md'),
      recipes: path.join(library, 'recipes'),
      components,
      ui: alias(config.aliases.ui, () => path.join(components, 'ui')),
      lib: alias(itemAlias(config.aliases, 'lib'), () => path.resolve(components, '..', 'lib')),
      composables: alias(itemAlias(config.aliases, 'composables'), () => path.resolve(components, '..', 'composables')),
    },
  })
}

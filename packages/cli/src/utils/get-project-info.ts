import fs from 'fs-extra'
import { getTsconfig } from 'get-tsconfig'
import path from 'pathe'
import { coerce, intersects, lt, validRange } from 'semver'
import { glob } from 'tinyglobby'
import { projectConfig as configFor } from '@/src/project-config'
import type { RawConfig } from '@/src/schema'
import { FRAMEWORKS, type Framework } from '@/src/utils/frameworks'
import { getPackageInfo } from '@/src/utils/get-package-info'

export type TailwindVersion = 'v3' | 'v4' | null

/** The oldest Tailwind CSS the registry's classes compile on: the minor it is built and tested with. */
export const TAILWIND_FLOOR = '4.3.0'

export const tailwindOutdated = (found: string) =>
  `Frontic UI needs Tailwind CSS ${TAILWIND_FLOOR} or newer; this project has ${found}. Upgrade tailwindcss and its Vite or PostCSS plugin, then try again.`

export interface ProjectInfo {
  framework: Framework
  typescript: boolean
  tailwindCssFile: string | null
  tailwindVersion: TailwindVersion
  tailwindBelowFloor: string | null
  aliasPrefix: string | null
}

const PROJECT_SHARED_IGNORE = ['**/node_modules/**', '.nuxt', 'public', 'dist', 'build']

export async function detectFrameworkConfigFiles(cwd: string): Promise<Framework | null> {
  const packageInfo = getPackageInfo(cwd, false)
  const configFiles = await glob('**/{nuxt,vite,astro,wxt}.config.*|composer.json', { cwd, deep: 3, ignore: PROJECT_SHARED_IGNORE })

  if (configFiles.find((file) => file.startsWith('nuxt.config.'))) {
    const nuxtPkg = packageInfo?.dependencies?.nuxt || packageInfo?.devDependencies?.nuxt
    const nuxtVersion = (nuxtPkg && coerce(nuxtPkg)?.version) || '4.0.0'
    if (nuxtVersion.startsWith('4')) return FRAMEWORKS.nuxt4
    if (nuxtVersion.startsWith('3')) return FRAMEWORKS.nuxt3
    return null
  }
  if (configFiles.find((file) => file.startsWith('astro.config.'))) return FRAMEWORKS.astro
  if (configFiles.find((file) => file.startsWith('composer.json'))) return FRAMEWORKS.laravel
  if (packageInfo?.dependencies?.['@inertiajs/vue3'] || packageInfo?.devDependencies?.['@inertiajs/vue3'] || (await fs.pathExists(path.join(cwd, 'resources/js')))) return FRAMEWORKS.inertia
  if (configFiles.find((file) => file.startsWith('wxt.config.') || file.startsWith('vite.config.'))) return FRAMEWORKS.vite
  return null
}

export async function isTypeScriptProject(cwd: string) {
  const files = await glob('tsconfig.*', { cwd, deep: 1, ignore: PROJECT_SHARED_IGNORE })
  return files.length > 0
}

export async function getProjectInfo(cwd: string): Promise<ProjectInfo> {
  const [framework, typescript, tailwindCssFile, tailwindVersion, aliasPrefix] = await Promise.all([
    detectFrameworkConfigFiles(cwd),
    isTypeScriptProject(cwd),
    getTailwindCssFile(cwd),
    getTailwindVersion(cwd),
    getTsConfigAliasPrefix(cwd),
  ])
  return { framework: framework || FRAMEWORKS.manual, typescript, tailwindCssFile, tailwindVersion, tailwindBelowFloor: getTailwindBelowFloor(cwd), aliasPrefix }
}

/** The tailwindcss/package.json the project's build loads: the nearest node_modules from cwd up, as in a workspace that hoists it to the root. */
function findTailwindManifest(cwd: string): string | null {
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'node_modules/tailwindcss/package.json')
    if (fs.existsSync(manifest)) return manifest
    if (path.dirname(dir) === dir) return null
  }
}

/** The Tailwind CSS below TAILWIND_FLOOR the project uses: the installed release, or before an install a package.json range that cannot reach the floor; null when it is new enough or unknown. */
export function getTailwindBelowFloor(cwd: string): string | null {
  const manifest = findTailwindManifest(cwd)
  if (manifest) {
    const version: string | undefined = fs.readJsonSync(manifest, { throws: false })?.version
    const release = version ? coerce(version) : null
    return release && lt(release, TAILWIND_FLOOR) ? version! : null
  }
  const packageInfo = getPackageInfo(cwd, false)
  const range = packageInfo?.dependencies?.tailwindcss || packageInfo?.devDependencies?.tailwindcss
  return range && validRange(range) && !intersects(range, `>=${TAILWIND_FLOOR}`) ? range : null
}

/** The Tailwind major the project installs, from package.json: v3 by its range, v4 for any other tailwindcss or the Nuxt module, null without either. */
export async function getTailwindVersion(cwd: string): Promise<TailwindVersion> {
  const packageInfo = getPackageInfo(cwd, false)
  const tailwind = packageInfo?.dependencies?.tailwindcss || packageInfo?.devDependencies?.tailwindcss
  const nuxtTailwind = packageInfo?.dependencies?.['@nuxtjs/tailwindcss'] || packageInfo?.devDependencies?.['@nuxtjs/tailwindcss']
  if (!tailwind && !nuxtTailwind) return null
  if (/^(?:\^|~)?3(?:\.\d+)*(?:-.*)?$/.test(tailwind || '')) return 'v3'
  return 'v4'
}

/** The first stylesheet that imports tailwindcss, relative to cwd. */
export async function getTailwindCssFile(cwd: string) {
  const files = await glob(['**/*.css', '**/*.scss'], { cwd, deep: 5, ignore: PROJECT_SHARED_IGNORE })
  for (const file of files) {
    const contents = await fs.readFile(path.resolve(cwd, file), 'utf8')
    if (contents.includes('@import "tailwindcss"') || contents.includes("@import 'tailwindcss'") || contents.includes('@tailwind base')) return file
  }
  return null
}

export async function getTsConfigAliasPrefix(cwd: string) {
  const detectedFramework = await detectFrameworkConfigFiles(cwd)
  const isTypeScript = await isTypeScriptProject(cwd)
  const tsConfig = getTsconfig(
    cwd,
    detectedFramework?.name === 'nuxt4' ? './.nuxt/tsconfig.app.json' : detectedFramework?.name === 'nuxt3' ? './.nuxt/tsconfig.json' : detectedFramework?.name === 'inertia' ? './inertia/tsconfig.json' : isTypeScript ? './tsconfig.json' : './jsconfig.json',
  )
  const aliasPaths = tsConfig?.config.compilerOptions?.paths ?? {}
  if (!Object.keys(aliasPaths).length) return null

  // Nuxt writes its tsconfig into .nuxt/, so there the source directory is a parent path.
  for (const [alias, paths] of Object.entries(aliasPaths)) {
    if (paths.includes('./*') || paths.includes('./src/*') || paths.includes('./app/*') || paths.includes('./resources/js/*') || paths.includes('../app/*') || paths.includes('../*')) {
      const cleanAlias = alias.replace(/\/\*$/, '')
      return cleanAlias === '#build' ? '@' : cleanAlias
    }
  }
  return Object.keys(aliasPaths)[0]?.replace(/\/\*$/, '') ?? null
}

/** A components.json for the detected project; null when it has no Tailwind CSS file or no import alias. */
export const projectConfig: (projectInfo: ProjectInfo) => RawConfig | null = configFor

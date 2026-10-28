// No alias imports and no fs: the ui site renders its components.json from this module.
import { DEFAULT_CHECK } from './check-schema'

export const CONFIG_SCHEMA_URL = 'https://registry.ui.frontic.com/schema.json'

/** The one style the registry serves. */
export const STYLE = 'bare'

export const DEFAULT_LIBRARY = 'library'

export interface ProjectConfigInput {
  typescript: boolean
  tailwindCssFile: string | null
  aliasPrefix: string | null
}

/** What `create` leaves for a Nuxt 4 project. */
export const NUXT_PROJECT: ProjectConfigInput = { tailwindCssFile: 'app/assets/css/tailwind.css', aliasPrefix: '@', typescript: true }

/** A components.json for the detected project; null when it has no Tailwind CSS file or no import alias. */
export function projectConfig(projectInfo: ProjectConfigInput) {
  if (!projectInfo.tailwindCssFile || !projectInfo.aliasPrefix) return null
  const prefix = projectInfo.aliasPrefix
  return {
    $schema: CONFIG_SCHEMA_URL,
    style: STYLE as typeof STYLE,
    typescript: projectInfo.typescript,
    tailwind: { css: projectInfo.tailwindCssFile },
    iconLibrary: 'lucide' as const,
    aliases: { components: `${prefix}/components`, ui: `${prefix}/components/ui`, lib: `${prefix}/lib`, composables: `${prefix}/composables` },
    library: DEFAULT_LIBRARY,
    check: structuredClone(DEFAULT_CHECK),
  }
}

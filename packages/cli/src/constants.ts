import type { IconLibraryName } from '@frontic/registry-client'

export { CONFIG_SCHEMA_URL, DEFAULT_LIBRARY, STYLE } from '@/src/project-config'

export const DEFAULT_TAILWIND_CSS = 'assets/css/tailwind.css'

/** The import path lib or composable items install under: components.json's alias, else the components alias's sibling, e.g. `~/lib` beside `~/components`. */
export function itemAlias(aliases: { components: string; lib?: string; composables?: string }, kind: 'lib' | 'composables'): string {
  const parent = aliases.components.slice(0, Math.max(aliases.components.lastIndexOf('/'), 0))
  return aliases[kind] ?? `${parent || '@'}/${kind}`
}

/** The icon libraries an item can be rewritten to; `import` is the module its icons come from, `packages` what the project installs. */
export const ICON_LIBRARIES: readonly { name: IconLibraryName; label: string; import: string; packages: readonly string[] }[] = [
  { name: 'lucide', label: 'Lucide', import: '@lucide/vue', packages: ['@lucide/vue'] },
  { name: 'tabler', label: 'Tabler Icons', import: '@tabler/icons-vue', packages: ['@tabler/icons-vue'] },
  { name: 'hugeicons', label: 'HugeIcons', import: '@hugeicons/core-free-icons', packages: ['@hugeicons/vue', '@hugeicons/core-free-icons'] },
  { name: 'phosphor', label: 'Phosphor Icons', import: '@phosphor-icons/vue', packages: ['@phosphor-icons/vue'] },
  { name: 'remixicon', label: 'Remix Icon', import: '@remixicon/vue', packages: ['@remixicon/vue'] },
]

export const iconLibrary = (name: string) => ICON_LIBRARIES.find((library) => library.name === name)

/** What every project needs besides its items: the primitives, the variant helper and the animation utilities the items use. */
export const BASE_DEPENDENCIES = ['reka-ui', 'class-variance-authority']
export const BASE_DEV_DEPENDENCIES = ['tw-animate-css']

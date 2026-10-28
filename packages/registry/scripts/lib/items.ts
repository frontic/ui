import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export type ComponentTier = 'ui' | 'sections' | 'templates'
/** The component folders; lib and composable items sit flat in their own folders, one `<name>.ts` each. */
export const TIERS: readonly ComponentTier[] = ['ui', 'sections', 'templates']
export type FlatTier = 'lib' | 'composables'
export const FLAT_TIERS: readonly FlatTier[] = ['lib', 'composables']
export type Tier = ComponentTier | FlatTier
export const TYPE_OF_TIER = {
  ui: 'registry:ui',
  sections: 'registry:component',
  templates: 'registry:block',
  lib: 'registry:lib',
  composables: 'registry:composable',
} as const
export type ItemType = (typeof TYPE_OF_TIER)[Tier]

export interface SourceItem {
  name: string
  tier: Tier
  type: ItemType
  files: Record<string, string>
}

// keep in sync with NAME and PATH_CHARS in the stack's apps/admin-cli/src/composables/fronticRegistry.ts
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const PATH_CHARS = /^[A-Za-z0-9@._/-]{1,256}$/
// The served index and registry files sit beside the item files.
const RESERVED = new Set(['index', 'registry'])

/** A 0.9 recipe file, `<recipe>.recipe.json`: refused, an item's trees sit in its manifest. */
const OLD_RECIPE_FILE = '.recipe.json'

/** Every file of an item folder but its manifest `<name>.json`, which is read as the item's entry and recipes, never as one of its files. */
function filesUnder(dir: string, name: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') && (prefix || entry.name !== `${name}.json`))
    .flatMap((entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      return entry.isDirectory() ? filesUnder(dir, name, rel) : [rel]
    })
    .sort()
}

/** A ui item, section or template: what renders, as against a lib or composable item. */
export const isComponentType = (type: string) => type === TYPE_OF_TIER.ui || type === TYPE_OF_TIER.sections || type === TYPE_OF_TIER.templates

export const isFlatTier = (tier: Tier): tier is FlatTier => (FLAT_TIERS as readonly Tier[]).includes(tier)

/** An item file's path under the registry root. */
export const sourcePath = (item: Pick<SourceItem, 'tier' | 'name'>, rel: string) => (isFlatTier(item.tier) ? `${item.tier}/${rel}` : `${item.tier}/${item.name}/${rel}`)

/** Each `<folder>/<name>.ts` is an item named by its basename. */
function readFlatItems(root: string, tier: FlatTier, seen: Map<string, Tier>): SourceItem[] {
  const dir = join(root, tier)
  if (!existsSync(dir)) return []
  const items: SourceItem[] = []
  for (const file of readdirSync(dir).sort()) {
    if (file.startsWith('.') || (file.endsWith('.json') && existsSync(join(dir, `${file.slice(0, -5)}.ts`)))) continue
    const name = file.replace(/\.ts$/, '')
    if (!file.endsWith('.ts') || statSync(join(dir, file)).isDirectory() || !NAME.test(name) || name.length > 128 || RESERVED.has(name)) {
      throw new Error(`${tier}/${file} is not a registry ${tier} item: one is a single ${tier}/<name>.ts`)
    }
    const other = seen.get(name)
    if (other) throw new Error(`${name} is in both ${other}/ and ${tier}/`)
    seen.set(name, tier)
    const served = `${tier}/${file}`
    if (!PATH_CHARS.test(served)) throw new Error(`${served} has characters or a length the Frontic CLI refuses`)
    items.push({ name, tier, type: TYPE_OF_TIER[tier], files: { [file]: readFileSync(join(dir, file), 'utf8') } })
  }
  return items
}

export function readSourceItems(root: string): SourceItem[] {
  const items: SourceItem[] = []
  const seen = new Map<string, Tier>()
  for (const tier of TIERS) {
    const tierDir = join(root, tier)
    if (!existsSync(tierDir)) continue
    for (const name of readdirSync(tierDir).sort()) {
      const dir = join(tierDir, name)
      if (name.startsWith('.') || !statSync(dir).isDirectory()) continue
      if (!NAME.test(name) || name.length > 128 || RESERVED.has(name)) throw new Error(`${tier}/${name} is not a registry item name`)
      const other = seen.get(name)
      if (other) throw new Error(`${name} is in both ${other}/ and ${tier}/`)
      seen.set(name, tier)
      const files: Record<string, string> = {}
      for (const rel of filesUnder(dir, name)) {
        if (rel.endsWith(OLD_RECIPE_FILE)) throw new Error(`${tier}/${name}/${rel}: a 0.9 recipe file; an item’s trees sit in its manifest, ${tier}/${name}/${name}.json`)
        const served = `components/${tier}/${name}/${rel}`
        if (!PATH_CHARS.test(served)) throw new Error(`${served} has characters or a length the Frontic CLI refuses`)
        files[rel] = readFileSync(join(dir, rel), 'utf8')
      }
      items.push({ name, tier, type: TYPE_OF_TIER[tier], files })
    }
  }
  for (const tier of FLAT_TIERS) items.push(...readFlatItems(root, tier, seen))
  return items
}

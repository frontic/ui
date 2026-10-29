import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ITEM_MANIFEST_KEYS, manifestNameProblems, manifestOrderProblems, treeOwner } from '@frontic/library-contract/recipe'
import { FLAT_TIERS, isFlatTier, type Tier, TIERS } from './items'
import type { AuthoredEntry } from './served'

/** What an item's manifest may hold, in the order the registry writes it: the contract's keys, and the registry's own `components`, what each part
 * the item exports is for, which the API reference reads and a project's manifest does not carry. */
export const MANIFEST_KEYS = [...ITEM_MANIFEST_KEYS.slice(0, 5), 'components', ...ITEM_MANIFEST_KEYS.slice(5)] as const

/** The registry's own name and homepage, served in v1/registry.json. */
export const REGISTRY = { name: 'frontic-ui', homepage: 'https://ui.frontic.com' } as const

/** An item's manifest under the registry root: `<tier>/<name>/<name>.json`, or `<tier>/<name>.json` beside a lib or composable. */
export const manifestPath = (tier: Tier, name: string) => (isFlatTier(tier) ? `${tier}/${name}.json` : `${tier}/${name}/${name}.json`)

export interface Manifests {
  /** Each manifest as an authored entry, named by its item, in source order. */
  entries: AuthoredEntry[]
  /** Each item's manifest path. */
  paths: Record<string, string>
  /** Each component manifest's `recipes`, as a recipe file at the manifest's path. */
  recipes: { path: string; text: string }[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** The items a manifest could belong to, in source order: every tier folder, and every lib or composable `.ts`. */
function itemsAt(root: string, problems: string[]): { tier: Tier; name: string }[] {
  const items: { tier: Tier; name: string }[] = []
  for (const tier of TIERS) {
    const dir = join(root, tier)
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir).sort()) if (!name.startsWith('.') && statSync(join(dir, name)).isDirectory()) items.push({ tier, name })
  }
  for (const tier of FLAT_TIERS) {
    const dir = join(root, tier)
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir).sort()) {
      if (file.endsWith('.ts')) items.push({ tier, name: file.slice(0, -3) })
      else if (file.endsWith('.json') && !existsSync(join(dir, `${file.slice(0, -5)}.ts`))) problems.push(`${tier}/${file}: a manifest for no item; ${tier}/<name>.json sits beside ${tier}/<name>.ts`)
    }
  }
  return items
}

/** Every item's manifest: its authored entry, its path, and a component's recipes. An item without one has no entry. Throws naming every problem. */
export function readManifests(root: string): Manifests {
  const problems: string[] = []
  const found = itemsAt(root, problems)
  const names = found.map((item) => item.name)
  const entries: AuthoredEntry[] = []
  const paths: Record<string, string> = {}
  const recipes: { path: string; text: string }[] = []
  const at: string[] = []
  for (const { tier, name } of found) {
    const path = manifestPath(tier, name)
    if (!existsSync(join(root, path))) continue
    let manifest: unknown
    try {
      manifest = JSON.parse(readFileSync(join(root, path), 'utf8'))
    } catch {
      at.push(`${path}: not JSON`)
      continue
    }
    if (!isRecord(manifest)) {
      at.push(`${path}: holds an item's manifest, a JSON object`)
      continue
    }
    const before = at.length
    for (const key of Object.keys(manifest)) if (!(MANIFEST_KEYS as readonly string[]).includes(key)) at.push(`${path}: ${key} is not a manifest key: ${MANIFEST_KEYS.join(', ')}`)
    for (const problem of manifestOrderProblems(manifest)) at.push(`${path}: ${problem}`)
    for (const problem of manifestNameProblems(manifest, name)) at.push(`${path}: ${problem}`)
    if (Object.hasOwn(manifest, 'meta')) at.push(`${path}: meta is gone: the item's own trees go in recipes, each shared recipe it puts on an element in the composes of that element's tree`)
    if (Object.hasOwn(manifest, 'composes')) at.push(`${path}: composes: move it into the trees that wear it, "<tree>": { "composes": [ … ] }; the served item derives the list from them`)
    if (Object.hasOwn(manifest, 'recipes')) {
      if (isFlatTier(tier)) at.push(`${path}: recipes: a lib or composable item has no recipe`)
      else if (!isRecord(manifest.recipes)) at.push(`${path}: recipes: holds the item's trees by name, a JSON object`)
      else
        for (const tree of Object.keys(manifest.recipes)) {
          const owner = treeOwner(tree, names)
          if (owner !== name) at.push(`${path}: recipes: ${tree} belongs to ${owner ?? 'no item'}; a tree sits in the manifest of the item whose name it starts with, the longest one`)
        }
    }
    if (at.length > before) continue
    const { $schema: _schema, ...entry } = manifest
    const own = manifest.recipes
    entries.push({ ...entry, name } as AuthoredEntry)
    paths[name] = path
    if (own !== undefined) recipes.push({ path, text: JSON.stringify(own) })
  }
  const all = [...at, ...problems]
  if (all.length) throw new Error(`manifests:\n${all.join('\n')}`)
  return { entries, paths, recipes }
}

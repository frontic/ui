import { isTree, composesOf, STATE_RECIPES, TREE_KEYS, treeOwner, type ComponentTree } from '@frontic/library-contract/recipe'
import { recipeMap } from '@frontic/library-contract/item'
import { isComponentType } from './items'
import { usedFamilies, type ServedItem } from './served'

/** A tree that styles its element; one holding only `composes` makes no class and leads no family. */
const styled = (def: unknown) => isTree(def) && TREE_KEYS.some((key) => Object.hasOwn(def, key))

/** families.json: each group and the families it holds, in the order consumers show them. */
export interface FamilyGroup {
  group: string
  title: string
  families: string[]
}

export interface FamilyTable {
  groups: FamilyGroup[]
}

/** The served table: each group with the served items that belong to it. */
export interface ServedFamilyTable {
  groups: (FamilyGroup & { items: string[] })[]
}

/** A flat recipe no group names, or a family in two groups. A group may name families no recipe file defines yet. */
export function familyTableProblems(table: FamilyTable, flat: string[]): string[] {
  const families = table.groups.flatMap((g) => g.families)
  const twice = [...new Set(families.filter((name, i) => families.indexOf(name) !== i))].map((name) => `family ${name} is in two groups`)
  return [...twice, ...flat.filter((name) => !families.includes(name)).map((name) => `${name} is a family no group names`)]
}

/** The item's main recipe: the tree named like the item, else its root part's (`default`, then `root`), when treeOwner gives it to the item. */
export function mainRecipe(item: ServedItem): ComponentTree | undefined {
  const { default: main, root } = recipeMap(item)
  const name = [item.name, main, root].find((tree) => tree && treeOwner(tree, [item.name]) === item.name && styled(item.recipes[tree]))
  return name ? (item.recipes[name] as ComponentTree) : undefined
}

const mainFamilies = (item: ServedItem): string[] => {
  const main = mainRecipe(item)
  return main ? usedFamilies(main) : []
}

/** The groups tied for the most of these families, in table order. */
function topGroups(table: FamilyTable, groupOf: Map<string, string>, families: string[]): string[] {
  const counts: Record<string, number> = {}
  for (const family of families) {
    const group = groupOf.get(family)
    if (group) counts[group] = (counts[group] ?? 0) + 1
  }
  const top = Math.max(0, ...Object.values(counts))
  return table.groups.map((g) => g.group).filter((g) => top > 0 && counts[g] === top)
}

/** How an item was placed: by the most-used group, by its main recipe or its content tree breaking a tie, or nowhere (an unbroken tie, or no family used). */
export interface Placement {
  group: string | null
  counts: Record<string, number>
  by: 'count' | 'main' | 'content' | 'tie' | 'none'
}

/** Each recipe of the item that counts toward its group, with the families it uses once: every tree treeOwner gives the item counts its `use`s, every part mapped to a flat recipe wears it. States are applied behind variants, never worn. */
export function familyUses(item: ServedItem, items: string[]): { recipe: string; families: string[] }[] {
  const trees = Object.keys(item.recipes).filter((name) => styled(item.recipes[name]) && treeOwner(name, items) === item.name)
  const library = item.library?.recipes ?? {}
  const worn = composesOf(item).filter((name) => Object.hasOwn(library, name) && !isTree(library[name]) && !(STATE_RECIPES as readonly string[]).includes(name))
  return [...trees.map((recipe) => ({ recipe, families: [...new Set(usedFamilies(item.recipes[recipe] as ComponentTree))] })), ...worn.map((recipe) => ({ recipe, families: [recipe] }))]
}

/** Each part's families once, as familyUses counts them. */
export function partFamilies(item: ServedItem, items: string[]): string[][] {
  return familyUses(item, items).map((use) => use.families)
}

/** The item's group: the one whose families its parts use most often; a tie goes to its main recipe's group, then to whichever tied group its `<item>-content` tree uses most, else nowhere. */
export function placement(table: FamilyTable, item: ServedItem, items: string[]): Placement {
  const groupOf = new Map(table.groups.flatMap((g) => g.families.map((f) => [f, g.group] as const)))
  const counts: Record<string, number> = {}
  for (const family of partFamilies(item, items).flat()) {
    const group = groupOf.get(family)
    if (group) counts[group] = (counts[group] ?? 0) + 1
  }
  const top = Math.max(0, ...Object.values(counts))
  const leaders = table.groups.map((g) => g.group).filter((g) => counts[g] === top && top > 0)
  if (!leaders.length) return { group: null, counts, by: 'none' }
  if (leaders.length === 1) return { group: leaders[0]!, counts, by: 'count' }
  const main = mainFamilies(item)
    .map((f) => groupOf.get(f))
    .find((g) => g && leaders.includes(g))
  if (main) return { group: main, counts, by: 'main' }
  const content = item.recipes[`${item.name}-content`]
  const framed = content && isTree(content) ? [...new Set(usedFamilies(content as ComponentTree))].filter((f) => leaders.includes(groupOf.get(f) ?? '')) : []
  const frame = topGroups(table, groupOf, framed)
  return frame.length === 1 ? { group: frame[0]!, counts, by: 'content' } : { group: null, counts, by: 'tie' }
}

/** The table as served: every group with its member items, in served order. */
export function servedFamilyTable(table: FamilyTable, all: ServedItem[]): ServedFamilyTable {
  const served = all.filter((item) => isComponentType(item.type))
  const names = served.map((item) => item.name)
  const member = new Map(served.map((item) => [item.name, placement(table, item, names).group]))
  return { groups: table.groups.map((g) => ({ ...g, items: served.filter((item) => member.get(item.name) === g.group).map((item) => item.name) })) }
}

/** The served components no group holds, in served order. */
export function ownLook(table: ServedFamilyTable, served: ServedItem[]): string[] {
  const placed = new Set(table.groups.flatMap((g) => g.items))
  return served
    .filter((item) => isComponentType(item.type))
    .map((item) => item.name)
    .filter((name) => !placed.has(name))
}

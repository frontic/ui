import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { brandUtilities, containerNames, stylePresetPath, stylePresets, withBrandStyles } from '@frontic/library-contract/brand'
import { pascalName, recipeClasses, recipeMap } from '@frontic/library-contract/item'
import { classGroups, classTokens, componentProblems as contractComponentProblems, componentSite, composesProblems, expectedClasses } from '@frontic/library-contract/components'
import {
  type ComponentTree,
  CONTRAST_PROPERTIES,
  designWarnings,
  LAYOUT_PARTS,
  LAYOUT_STEPS,
  normalizeRecipe,
  parseRef,
  PARTS,
  RECIPE_BLOCKS,
  RECIPE_KEY,
  RECIPE_NAME,
  TREE_KEYS,
  readRecipeFiles,
  recipeNameProblem,
  recipeProblems,
  treeEntries,
  treeOwner,
  treeProblems,
  WITH,
} from '@frontic/library-contract/recipe'
import { type SourceItem, type Tier } from './items'
import { manifestPath, readManifests } from './manifests'
import type { AuthoredEntry } from './served'
import { contrastLine, recipeContrastProblems } from '@frontic/library-contract/contrast'

const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const members = (node: unknown) => (isRecord(node) ? Object.keys(node).filter((k) => !k.startsWith('$')) : [])

export interface BrandNames {
  colors: Set<string>
  rounded: Set<string>
  shadow: Set<string>
  typography: Set<string>
  border: Set<string>
  ring: Set<string>
  opacity: Set<string>
  /** The text styles the theme names `text-<name>`. */
  textStyles: Set<string>
  /** The container sizes `{container.<name>}` may reference. */
  container: Set<string>
}

/** A brand's names after the brand build fills the text styles and borders it lacks. */
export function brandNames(brand: unknown): BrandNames {
  const tokens = withBrandStyles(isRecord(brand) ? brand : {})
  const color = isRecord(tokens.color) ? tokens.color : {}
  return {
    colors: new Set(members(color).flatMap((bucket) => members(color[bucket]))),
    rounded: new Set(members(tokens.radius)),
    shadow: new Set(members(tokens.shadow)),
    typography: new Set(members(tokens.text)),
    border: new Set(members(tokens.border)),
    ring: new Set(members(tokens.ring)),
    opacity: new Set(members(tokens.opacity)),
    textStyles: new Set(brandUtilities(tokens).text),
    container: new Set(containerNames(tokens)),
  }
}

/** The names a generic recipe may reference: the contract's default brand. */
export function defaultBrandNames(): BrandNames {
  return brandNames(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')))
}

export interface GenericRecipes {
  flat: Record<string, Record<string, unknown>>
  trees: Record<string, ComponentTree>
}

export interface RegistryRecipes extends GenericRecipes {
  /** Each recipe's file, relative to the registry root. */
  paths: Record<string, string>
}

/** Every file under `dir` that `keep` takes, as `{ path, text }` with the path relative to `root`; a missing `dir` has none. */
function filesUnder(dir: string, root: string, keep: (name: string) => boolean): { path: string; text: string }[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .flatMap((entry) => {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) return filesUnder(full, root, keep)
      return keep(entry.name) ? [{ path: relative(root, full).split(sep).join('/'), text: readFileSync(full, 'utf8') }] : []
    })
}

/** The registry's recipes: each tree from the manifest of the item that maps it (`<tier>/<item>/<item>.json`), flat recipes from
 * `recipes/shared/`. Throws naming every file that cannot be read, and when there are none. */
export function readRegistryRecipes(root: string): RegistryRecipes {
  const files = [...filesUnder(join(root, 'recipes'), root, (name) => name.endsWith('.json')), ...readManifests(root).recipes]
  const { flat, trees, paths, problems } = readRecipeFiles(files)
  if (problems.length) throw new Error(`recipe files:\n${problems.join('\n')}`)
  if (!Object.keys(paths).length) throw new Error('recipe files: none under recipes/shared/ or in a manifest')
  return { flat: Object.fromEntries(Object.entries(flat).map(([name, def]) => [name, isRecord(def) ? def : {}])), trees: trees as Record<string, ComponentTree>, paths }
}

/** Where each recipe sits against who maps it: a flat recipe in its own `recipes/shared/<name>.json`, a tree in the manifest of the item that maps it. */
export function recipePlacementProblems(recipes: Pick<RegistryRecipes, 'flat' | 'trees' | 'paths'>, maps: { name: string; tier: Tier; recipes: Record<string, string> }[]): string[] {
  const problems: string[] = []
  const byManifest = new Map(maps.map((map) => [manifestPath(map.tier, map.name), map]))
  for (const [name, path] of Object.entries(recipes.paths)) {
    if (Object.hasOwn(recipes.flat, name)) {
      if (!path.startsWith('recipes/shared/')) problems.push(`${path}: ${name} is a flat recipe; flat recipes sit in recipes/shared/`)
      else if (path !== `recipes/shared/${name}.json`) problems.push(`${path}: holds ${name}; a shared file holds the one recipe it is named after`)
      continue
    }
    if (path.startsWith('recipes/')) {
      problems.push(`${path}: ${name} is a tree; a tree sits in the manifest of the item that maps it`)
      continue
    }
    const owner = byManifest.get(path)
    // A tree holding only composes makes no class to map; it is the item's root, named after it.
    if (!owner || !(Object.values(owner.recipes).includes(name) || name === owner.name))
      problems.push(`${path}: ${owner?.name ?? path} does not map ${name}; a manifest’s recipes are the trees its item maps`)
  }
  return problems
}

/** Every recipe colour below its contrast threshold, on every shipped preset, as `<recipe>.<at>: …` lines. */
export function contrastGate(recipes: GenericRecipes): { preset: string; line: string }[] {
  return stylePresets().flatMap((preset) => recipeContrastProblems(recipes, JSON.parse(readFileSync(preset.path, 'utf8'))).map((pair) => ({ preset: preset.id, line: contrastLine(pair) })))
}

/** The gate's rules beyond the contract's: the generic brand's names, string values, no literal colour on a free property. */
function brandProblems(at: string, value: unknown, names: BrandNames): string[] {
  const groups: Record<string, Set<string>> = {
    colors: names.colors,
    rounded: names.rounded,
    shadow: names.shadow,
    typography: names.typography,
    border: names.border,
    ring: names.ring,
    opacity: names.opacity,
  }
  if (value === true && at.split('.').at(-1) === CONTRAST_PROPERTIES.decorative) return []
  if (typeof value !== 'string') return [`${at}: must be a string of 1 to 500 characters`]
  const ref = parseRef(value)
  if (ref?.group === 'spacing') return []
  if (ref?.group === 'container') return names.container.has(ref.name) ? [] : [`${at}: the generic brand has no container.${ref.name}`]
  if (ref) {
    const known = Object.hasOwn(groups, ref.group) ? groups[ref.group] : undefined
    if (!known) return [`${at}: {${ref.group}.…} is not a token group a generic recipe may reference`]
    return known.has(ref.name) ? [] : [`${at}: the generic brand has no ${ref.group}.${ref.name}`]
  }
  return LITERAL_COLOUR.test(value) ? [`${at}: a literal colour; reference {colors.…}`] : []
}

const NESTED = new Set([...Object.keys(RECIPE_BLOCKS), ...Object.keys(LAYOUT_PARTS), ...LAYOUT_STEPS])

/** The gate's problems on one recipe's own properties, its blocks' too, skipping the paths in `refused`. */
function ownProblems(at: string, def: Record<string, unknown>, names: BrandNames, refused = new Set<string>()): string[] {
  const problems: string[] = []
  for (const [prop, value] of Object.entries(def)) {
    if (refused.has(prop)) continue
    if (!NESTED.has(prop) && prop !== PARTS) {
      problems.push(...brandProblems(`${at}.${prop}`, value, names))
      continue
    }
    for (const [inner, innerValue] of Object.entries(value as Record<string, unknown>)) {
      if (refused.has(`${prop}.${inner}`)) continue
      // the link part nests a state; a parts block nests a part's layout
      if ((NESTED.has(inner) || prop === PARTS) && isRecord(innerValue))
        for (const [deep, deepValue] of Object.entries(innerValue)) problems.push(...brandProblems(`${at}.${prop}.${inner}.${deep}`, deepValue, names))
      else problems.push(...brandProblems(`${at}.${prop}.${inner}`, innerValue, names))
    }
  }
  return problems
}

/** A tree's values by path: its base, each axis value, each pair block under a value's `with`. */
function treeValues(name: string, tree: ComponentTree): [string, unknown][] {
  const values: [string, unknown][] = tree.base === undefined ? [] : [[`${name}.base`, tree.base]]
  const walk = (at: string, def: unknown) => {
    values.push([at, def])
    const pairs = isRecord(def) && isRecord(def[WITH]) ? def[WITH] : {}
    for (const [axis, entries] of Object.entries(pairs)) if (isRecord(entries)) for (const [value, block] of Object.entries(entries)) walk(`${at}.${WITH}.${axis}.${value}`, block)
  }
  for (const [axis, entries] of Object.entries(tree.variants ?? {})) for (const [value, def] of Object.entries(entries)) walk(`${name}.variants.${axis}.${value}`, def)
  return values
}

/** The contract's problems first, as a library save reports them; the gate's own only where the contract found none; then each untyped property. */
export function recipeDefinitionProblems({ flat, trees }: GenericRecipes, names: BrandNames): string[] {
  const problems: string[] = []
  for (const [recipe, def] of Object.entries(flat)) {
    const nameProblem = recipeNameProblem(recipe)
    if (nameProblem) problems.push(`${recipe}: ${nameProblem}`)
    const contract = recipeProblems(def, recipe)
    problems.push(...contract.map(({ path, message }) => `${path ? `${recipe}.${path}` : recipe}: ${message}`))
    const refused = new Set(contract.map(({ path }) => path))
    if (refused.has('')) continue
    problems.push(...ownProblems(recipe, def, names, refused))
  }
  for (const [name, tree] of Object.entries(trees)) {
    // A tree holding only composes makes no class, so its name, the item's, reads as no state.
    const nameProblem = TREE_KEYS.some((key) => Object.hasOwn(tree, key)) ? recipeNameProblem(name) : undefined
    if (nameProblem) problems.push(`${name}: ${nameProblem}`)
    const contract = treeProblems(name, tree, flat)
    problems.push(...contract)
    if (contract.length) continue
    for (const [at, value] of treeValues(name, tree)) {
      const { extends: _, ...own } = normalizeRecipe(value) ?? {}
      problems.push(...ownProblems(at, own, names))
    }
  }
  // A project may render an untyped property with a warning; the registry ships typed recipes only.
  problems.push(...designWarnings({ flat, trees }))
  return problems
}

/** The shared state recipes, each with the variants it sits behind; no other recipe sits behind one. */
export const SHARED_STATES: Record<string, string[]> = {
  'focus-ring': ['focus-visible'],
  disabled: ['disabled', 'aria-disabled', 'data-disabled'],
  invalid: ['aria-invalid'],
}

/** Variants one item alone may show a shared state behind: the OTP slot rings where the caret stands; the select wrapper dims for its select, not a disabled option. */
export const ITEM_SHARED_STATES: Record<string, Record<string, string[]>> = {
  'input-otp': { 'focus-ring': ['data-active'] },
  'native-select': { disabled: ['has-[select:disabled]'] },
}
const SHARED_PREFIX = /^(?:peer|group|has)-(.+?)(?:\/[a-z][a-z0-9-]*)?$/

/** Two states one item shows at once, where the invalid look must win: the shared recipe again behind both variants. */
export const ITEM_STATE_COMPOUNDS: Record<string, Record<string, string[]>> = {
  'input-otp': { invalid: ['data-active:aria-invalid'] },
  checkbox: { invalid: ['aria-checked:aria-invalid'] },
}

/** Whether a variant shows a shared state: its own, a peer's, a named group's or a descendant's (`peer-disabled:`, `group-data-disabled/field:`, `has-focus-visible:`). */
export function sharedStateVariant(recipe: string, variant: string, item?: string): boolean {
  const own = SHARED_STATES[recipe] ?? []
  if ((item && ITEM_SHARED_STATES[item]?.[recipe]?.includes(variant)) || own.includes(variant)) return true
  return own.includes(SHARED_PREFIX.exec(variant)?.[1] ?? '')
}
export { expectedClasses }

const VARIANT_SPLIT = /:(?![^[]*\])/

function variantProblems(item: SourceItem, text: string): string[] {
  const problems: string[] = []
  for (const token of classTokens(text)) {
    const parts = token.split(VARIANT_SPLIT)
    const recipe = /^!?fui-(.+?)!?$/.exec(parts.at(-1)!)?.[1]
    if (!recipe) continue
    const variants = parts.slice(0, -1)
    const shared = SHARED_STATES[recipe]
    if (shared) {
      if (ITEM_STATE_COMPOUNDS[item.name]?.[recipe]?.includes(variants.join(':'))) continue
      if (variants.length !== 1 || !sharedStateVariant(recipe, variants[0]!, item.name))
        problems.push(
          `${item.name}: ${token} sits behind ${shared
            .map((v) => `${v}:`)
            .join(', ')
            .replace(/, ([^,]*)$/, ' or $1')}`,
        )
    } else if (variants.length) {
      problems.push(`${item.name}: ${token} — a value’s states live inside its recipe; write fui-${recipe} bare`)
    }
  }
  return problems
}

/** Every class a recipe map covers: each name it maps, and every class of a mapped tree; a pair makes no class. */
function covered(map: Record<string, string>, trees: Record<string, ComponentTree>): Map<string, string> {
  const owner = new Map<string, string>()
  for (const recipe of Object.values(map)) {
    owner.set(recipe, recipe)
    if (Object.hasOwn(trees, recipe)) for (const { name, layer } of treeEntries(recipe, trees[recipe])) if (layer !== 'compound') owner.set(name, recipe)
  }
  return owner
}

/** Whether `file` in an item's folder is one of its examples, `<name>.example.vue` or `<name>.<slug>.example.vue`. */
const isExample = (name: string, file: string) => file.startsWith(`${name}.`) && file.endsWith('.example.vue')

/** Every `fui-` class an item's files use is mapped, every mapped recipe is used, and `default` names the item's tree.
 * With `trees`, a mapped tree covers every class it makes. */
export function recipeMapProblems(item: SourceItem, entry: AuthoredEntry, trees?: Record<string, ComponentTree>): string[] {
  const problems: string[] = []
  const used = new Set<string>()
  for (const [file, text] of Object.entries(item.files)) {
    const found = recipeClasses(text)
    if (isExample(item.name, file)) {
      if (found.length) problems.push(`${item.name}: ${file} uses ${found.map((r) => `fui-${r}`).join(', ')}; an example styles nothing itself`)
      continue
    }
    found.forEach((r) => used.add(r))
    problems.push(...variantProblems(item, text))
  }
  const map = recipeMap(entry)
  for (const [key, recipe] of Object.entries(map)) {
    if (!RECIPE_KEY.test(key) || !RECIPE_NAME.test(recipe)) problems.push(`${item.name}: ${key} → ${recipe} is not a recipe key and name`)
  }
  if (trees && map.default !== undefined && !Object.hasOwn(trees, map.default)) problems.push(`${item.name}: default maps ${map.default}, which is no component tree`)
  const owner = covered(map, trees ?? {})
  const reached = new Set([...used].flatMap((r) => (owner.has(r) ? [owner.get(r)!] : [])))
  for (const recipe of used) if (!owner.has(recipe)) problems.push(`${item.name} uses fui-${recipe}, which is neither one of its trees nor composed by one`)
  for (const recipe of new Set(Object.values(map))) if (!reached.has(recipe)) problems.push(`${item.name} maps ${recipe}, but no file uses fui-${recipe}`)
  // An item with no component of its own, only script, has no look to map.
  const component = Object.keys(item.files).some((file) => file.endsWith('.vue') && !isExample(item.name, file))
  if (item.tier === 'ui' && component && owner.size === 0) problems.push(`${item.name}: a Base Component names at least one recipe`)
  return problems
}

/** Every shared recipe an element of the item wears without the tree that should compose it: its own tree, or the item's root tree for an
 * element carrying none. Examples are left out; they style nothing. */
export function itemComposesProblems(item: SourceItem, entry: AuthoredEntry, flat: Record<string, unknown>): string[] {
  const files = Object.fromEntries(Object.entries(item.files).filter(([file]) => file.endsWith('.vue') && !isExample(item.name, file)))
  return composesProblems(item.name, entry.recipes ?? {}, files, flat).map((problem) => `${item.name}: ${problem}`)
}

/** The trees an item owns: its own under `default`, and each part's `<item>-<part>` under `<part>`, where no longer item name claims it.
 * `items` names every item of the registry. */
export function ownedTrees(name: string, recipes: Record<string, string>, items: Iterable<string>): string[] {
  const names = [...items]
  return Object.entries(recipes).flatMap(([key, recipe]) => (((key === 'default' && recipe === name) || recipe === `${name}-${key}`) && treeOwner(recipe, names) === name ? [recipe] : []))
}

/** Trees an item maps but does not own: another item's tree, worn past that item's barrel. */
export function foreignTreeProblems(name: string, recipes: Record<string, string>, trees: Set<string>, items: Iterable<string>): string[] {
  const own = new Set(ownedTrees(name, recipes, items))
  return [...new Set(Object.values(recipes))].filter((r) => trees.has(r) && !own.has(r)).map((r) => `${name} maps ${r}, a tree another item owns; render that item through its barrel`)
}

/** Where a component differs from what its tree makes, as the contract checks it. The item's own tree sits in its main file; a part's
 * tree (`name` = `<item>-<part>`) in the file whose cva holds its class, else one that wears it. */
export function componentProblems(item: SourceItem, tree: ComponentTree, name = item.name): string[] {
  const main = `${pascalName(name)}.vue`
  const own = name === item.name
  const files = Object.fromEntries((own ? [main] : Object.keys(item.files).filter((f) => !isExample(item.name, f))).filter((f) => item.files[f] !== undefined).map((f) => [f, item.files[f]!]))
  if (!componentSite(name, files, own ? { main } : {})) return [own ? `${name}: has no ${main}` : `${name}: no file of ${item.name} wears fui-${name}`]
  return contractComponentProblems(name, tree, files, own ? { main } : {})
}

const COLOUR_UTILITY = /^(?:bg|text|border(?:-[xytrbl])?|ring|ring-offset|outline|fill|stroke|decoration|divide|placeholder|caret|accent|from|via|to)-(.+?)(?:\/\d+)?$/
const SHAPE_UTILITY = /^(?:rounded(?:-[a-z]{1,2})?|shadow|inset-shadow|drop-shadow)(?:-.+)?$/
const TYPE_UTILITY = /^(?:text-(?:xs|sm|base|lg|[2-9]?xl)|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|leading-.+|tracking-.+)$/
const BORDER_UTILITY = /^border(?:-[xytrbl])?(?:-\d+)?$/
/** Takes a radius, a border or the shadow off: how a joined group meets its neighbours, the same in every brand. */
const RESET_UTILITY = /^(?:rounded(?:-[a-z]{1,2})?-none|border(?:-[xytrbl])?-0|shadow-none)$/

const NUMERIC_SPACING = /^(?:h|min-h|w|size|p[xytrblse]?|-?m[xytrblse]?|gap(?:-[xy])?)-(?:\d+(?:\.\d+)?|\d+\/\d+|px)$/

/** A token's variants and utility, split at the colons outside brackets. */
function variantParts(token: string): string[] {
  const parts = ['']
  let depth = 0
  for (const c of token) {
    if (c === '[') depth++
    else if (c === ']') depth--
    if (c === ':' && depth === 0) parts.push('')
    else parts[parts.length - 1] += c
  }
  return parts
}

/** `has-[…]`, `has-data-x`, `not-has-[…]`, `group-has-[…]/name`, `[&>…]`, `[&_…]`, `*:`, `**:`, `first:`, `last:`, `nth-…:`: a structure no recipe
 * state reaches, or another element than the recipe's. */
const STRUCTURAL_VARIANT = /^(?:(?:group-|not-)?has-(?:\[.*\]|data-[\w-]+)(?:\/[\w-]+)?|\[&[>_].*\]|\*\*?|(?:first|last|only|odd|even)(?:-of-type)?|nth(?:-last)?(?:-of-type)?-\S+)$/
/** A height, width or size: what an icon takes from its recipe's icon part, whatever variant reaches it. */
const ICON_SIZE = /^(?:h|w|size)-/

/** A numeric height, width, size, padding, margin or gap utility behind any variant but `file:` and a structural one; icons size in the recipe either way. */
function isNumericSpacing(token: string): boolean {
  const parts = variantParts(token.replace(/^!|!$/g, ''))
  const variants = parts.slice(0, -1)
  const utility = parts.at(-1)!
  if (!NUMERIC_SPACING.test(utility) || variants.includes('file')) return false
  const iconSize = ICON_SIZE.test(utility) && variants.some((v) => /svg|data-icon/.test(v))
  return iconSize || !variants.some((v) => STRUCTURAL_VARIANT.test(v))
}

/** Colour, radius, shadow, text styles and borders belong to recipes, so a project's brand restyles them; anywhere in a file.
 * An element that wears a recipe takes its heights, widths, padding, margins and gaps from it too: per class attribute or cva call,
 * but for the `kept` utilities the file holds in its template because no recipe can (TEMPLATE_LAYOUT). */
export function paletteProblems(file: string, text: string, names: BrandNames, kept: ReadonlySet<string> = new Set()): string[] {
  const problems: string[] = []
  for (const token of classTokens(text)) {
    const utility = token.slice(token.lastIndexOf(':') + 1).replace(/^!|!$/g, '')
    const colour = COLOUR_UTILITY.exec(utility)?.[1]
    const brandText = utility.startsWith('text-') && names.textStyles.has(utility.slice(5))
    if (RESET_UTILITY.test(utility)) continue
    if ((colour && names.colors.has(colour)) || brandText || SHAPE_UTILITY.test(utility) || TYPE_UTILITY.test(utility) || BORDER_UTILITY.test(utility)) {
      problems.push(`${file}: ${token} styles colour, radius, shadow, text or border outside a recipe`)
    }
  }
  for (const group of classGroups(text)) {
    if (!group.some((token) => /^fui-/.test(token))) continue
    for (const token of group) if (isNumericSpacing(token) && !kept.has(token)) problems.push(`${file}: ${token} sits on an element that wears a recipe; set it in the recipe`)
  }
  return problems
}

/** What a recipe name and each of its property names must match to render. */
export const RECIPE_KEY: RegExp
export const RECIPE_NAME: RegExp
export const RECIPE_PROPERTY: RegExp

export type RecipeState =
  | 'hover'
  | 'active'
  | 'pressed'
  | 'focus'
  | 'checked'
  | 'checkedWithin'
  | 'focusWithin'
  | 'invalidWithin'
  | 'highlighted'
  | 'placeholderShown'
  | 'open'
  | 'selected'
  | 'invalid'
  | 'current'
export type RecipePart = 'file' | 'after' | 'link'
export const RECIPE_STATES: Readonly<Record<RecipeState, string>>
/** Every part a recipe may nest (`file`: the file selector button, `after`: `::after`, `link`: every link inside, which may nest a state), and the selector it renders under. */
export const RECIPE_PARTS: Readonly<Record<RecipePart, string>>
export const RECIPE_BLOCKS: Readonly<Record<RecipeState | RecipePart, string>>
/** Properties with no CSS property of their own, and the element their `color` reaches. */
export const RECIPE_NESTED_PROPERTIES: Readonly<Record<'placeholderColor' | 'iconColor', { readonly selector: string; readonly properties: readonly string[] }>>

/** Properties that hide a part of the element, each taking only the values listed, set on the element and under its selector at once. */
export const HIDE_PROPERTIES: Readonly<
  Record<'scrollbar', { readonly values: readonly string[]; readonly properties: readonly string[]; readonly nested: { readonly selector: string; readonly properties: readonly string[] } }>
>

/** The shared focus ring, which a value recipe may colour for its own element. */
export const FOCUS_RING: 'focus-ring'
/** The shared state recipes, each applied behind a variant over the value recipe. */
export const STATE_RECIPES: readonly ['focus-ring', 'disabled', 'invalid']
/** Properties a value recipe sets at its top level to colour the shared focus ring, and the variable each sets on the element. */
/** Properties the contrast check reads and the stylesheet never renders: `decorative: true` keeps a recipe or value out of the check, `ground` names the colour it sits on. */
export const CONTRAST_PROPERTIES: Readonly<{ decorative: 'decorative'; ground: 'ground' }>
export const RING_PROPERTIES: Readonly<Record<'ringColor' | 'ringBorderColor', string>>

/** The keys that make a recipe a component tree; a recipe holding none is a flat recipe. */
export const TREE_KEYS: readonly ['base', 'variants', 'defaults', 'keepAxis']
/** The key a tree's value holds a pair under: another axis mapped to the values the pair takes. */
export const WITH: 'with'
/** The axis a component's sizes ride on by convention; layout may sit on any axis's values. */
export const SIZE_AXIS: 'size'
export type LayoutProperty =
  | 'height'
  | 'minHeight'
  | 'width'
  | 'minWidth'
  | 'maxWidth'
  | 'size'
  | 'padding'
  | 'paddingX'
  | 'paddingY'
  | 'paddingTop'
  | 'paddingBottom'
  | 'paddingStart'
  | 'paddingEnd'
  | 'margin'
  | 'marginX'
  | 'marginY'
  | 'marginTop'
  | 'marginBottom'
  | 'marginStart'
  | 'marginEnd'
  | 'bleedX'
  | 'bleedY'
  | 'bleedTop'
  | 'bleedBottom'
  | 'bleedStart'
  | 'bleedEnd'
  | 'gap'
/** Properties that size and space an element, each taking a `{spacing.<n>}` step (the widths a `{container.<name>}` size too), and the CSS properties each sets.
 * `bleedX`, `bleedY`, `bleedTop`, `bleedBottom`, `bleedStart` and `bleedEnd` set the margin to the negative of the step. */
export const LAYOUT_PROPERTIES: Readonly<Record<LayoutProperty, readonly string[]>>
/** The keywords each layout property takes besides a step, each with the CSS of the Tailwind utility it replaces: sizes take `full`, `fit`, `auto`, `max`
 * and `min` (a max width no `auto`), heights `svh` too, margins `auto`. */
export const LAYOUT_KEYWORDS: Readonly<Partial<Record<LayoutProperty, Readonly<Record<string, string>>>>>
/** The Reka component whose variables a popup keyword (`trigger`, `available`, `viewport`) reads, by the item name a tree's name is or starts with. */
export const REKA_POPUPS: Readonly<Record<string, string>>
/** The Reka component a tree's popup keywords read, or undefined for a tree that is no popup's. */
export function rekaPopup(name: string): string | undefined
/** The property a tree's base sets to make its element the container its parts and descendants query; it renders as `container-type`. */
export const CONTAIN: 'contain'
/** The values `contain` takes: the inline axis only. */
export const CONTAIN_VALUES: readonly ['inline-size']
/** The container widths a layout value may step at: a value's `'@md'` block holds what its layout becomes once the nearest container is `container.md` wide. */
export const LAYOUT_STEPS: readonly ['@sm', '@md', '@lg']
export type LayoutStep = (typeof LAYOUT_STEPS)[number]
/** A step's name without its `@`: what its variables and the brand's `container` group carry. */
export function stepName(step: string): string
/** Blocks that size what sits inside the element (`icon`: every `[data-icon]`) or pad the element beside an edge icon (`iconStart`, `iconEnd`), with their selector and the layout properties they take. */
export const LAYOUT_PARTS: Readonly<Record<'icon' | 'iconStart' | 'iconEnd', { readonly selector: string; readonly properties: readonly LayoutProperty[] }>>

/** A property that takes a colour reference: `color`, `background`, `fill`, `stroke` or any `*Color`. */
export function isColorProperty(prop: string): boolean
export type TokenGroup = 'colors' | 'rounded' | 'shadow' | 'typography' | 'border' | 'ring' | 'opacity'
/** The one token group each non-colour property takes; a colour property takes `colors`, any other is free-form. */
export const PROPERTY_GROUP: Readonly<Record<string, Exclude<TokenGroup, 'colors'>>>
/** The keywords a property of a token group takes besides a reference to that group. */
export const VALUE_KEYWORDS: Readonly<Partial<Record<TokenGroup, readonly string[]>>>
/** Layout keywords: each value renders the CSS of the Tailwind utility it replaces, and steps at the container like a layout property. */
export type ArrangeProperty =
  | 'display'
  | 'flexDirection'
  | 'flexWrap'
  | 'alignItems'
  | 'alignSelf'
  | 'alignContent'
  | 'justifyContent'
  | 'justifyItems'
  | 'justifySelf'
  | 'placeItems'
  | 'placeContent'
  | 'flex'
  | 'flexGrow'
  | 'flexShrink'
  | 'gridColumns'
  | 'gridRows'
  | 'gridColumn'
  | 'gridRow'
/** Each layout keyword's values, each to the CSS it renders: `gridColumns: 3` is `repeat(3, minmax(0, 1fr))`. */
export const ARRANGE_VALUES: Readonly<Record<ArrangeProperty, Readonly<Record<string, string>>>>
/** Whether a property is a layout keyword. */
export function isArrange(prop: string): prop is ArrangeProperty
export const VALUE_SETS: Readonly<
  Record<'fontWeight' | 'lineHeight' | 'letterSpacing' | 'textDecorationLine' | 'visibility' | 'textAlign' | 'textTransform' | ArrangeProperty, Readonly<Record<string, string>>>
>
/** Properties a recipe may not set, each with the token that carries its value. */
export const REFUSED_PROPERTIES: Readonly<Record<string, string>>
/** Properties that take a colour token besides any whose name ends in Color. */
export const COLOR_PROPERTIES: readonly string[]
/** The token groups a recipe value may reference. */
export const REF_GROUPS: readonly string[]

export interface RecipeRef {
  group: string
  name: string
  /** The text after `/`, as written. */
  alpha?: string
  /** Why the reference would not render; absent when it renders. */
  problem?: string
}
/** A `{group.name}` or `{colors.name/NN}` reference as its parts; null for a value that is no reference. */
export function parseRef(value: unknown): RecipeRef | null

/** Why a recipe value would not render, as `<value> — <reason>`, or null. */
export function recipeValueProblem(prop: string, value: unknown): string | null
/** The block a flat property's variable would collide with, or undefined. */
export function collidingBlock(prop: string): string | undefined
/** Whether a property inside `block` would style an element a pseudo-element part cannot hold. */
export function reachesInsidePart(block: string, prop: string): boolean

export interface RecipeProblem {
  /** `prop` or `block.prop`; '' for the recipe as a whole. */
  path: string
  message: string
}
/** Every reason a recipe would not render as written, each with its path; [] when it renders whole.
 * Named, a flat recipe: no extends, with, parts or ring colour, and no layout on a shared state. Unnamed, a value block, `{ extends?, …properties }`; `{}` sets nothing. */
export function recipeProblems(def: unknown, name?: string): RecipeProblem[]
/** A recipe value, `{ extends?, …properties }`, rendering as written; a bare family name is none. */
export function isRecipeDefinition(def: unknown): boolean

export type RecipeValue = Record<string, unknown>
/** What an axis value holds beside its properties: `with` maps another axis to the values the pair takes, each a value block that may hold `with` again. */
export type WithBlock = Record<string, Record<string, RecipeValue>>
/** What a value or a with block holds under `parts`: each part tree of the component mapped to the layout properties its base takes. */
export type PartsBlock = Record<string, Partial<Record<LayoutProperty, string>>>
export interface ComponentTree {
  /** May hold `contain: 'inline-size'`, which no value or with block may. */
  base?: RecipeValue
  variants?: Record<string, Record<string, RecipeValue | ({ with?: WithBlock; parts?: PartsBlock } & Record<string, unknown>)>>
  defaults?: Record<string, string>
  /** Values whose class keeps its axis, `<name>-<axis>-<value>`, where the bare `<name>-<value>` is another recipe's name. */
  keepAxis?: string[]
  /** The shared recipes this tree's element wears, each a flat recipe; renders nothing. A tree may hold only this. */
  composes?: string[]
}
export type RecipeDefinition = Record<string, unknown>
/** The key a value names the families it extends under, a name or a list of them. */
export const EXTENDS: 'extends'
/** The key a value or a with block reshapes the tree's parts under: each part tree (`card-header` of `card`) mapped to the layout its base takes. */
export const PARTS: 'parts'
/** The family names a value's `extends` key holds; malformed entries are left out. */
export function parseExtends(value: unknown): string[]
/** A value in its full form, `{ extends?, …properties }`; null for anything that is no value. */
export function normalizeRecipe(value: unknown): ({ extends?: string[] } & Record<string, unknown>) | null
/** The keys only a component tree's value may hold, which a flat recipe never carries: extends, with, parts and the ring colours. */
export const TREE_ONLY: readonly string[]
/** Whether a recipe is a component tree. */
export function isTree(entry: unknown): entry is ComponentTree
/** Where a project recipe file says its schema. */
export const RECIPE_SCHEMA_URL: 'https://registry.ui.frontic.com/recipe.schema.json'
/** Where an item's manifest says its schema: the registry's source manifests, a project's component manifests and a stack's stored items. */
export const ITEM_SCHEMA_URL: 'https://registry.ui.frontic.com/item.schema.json'
/** The keys of an item's manifest, in the order it is written; a project's component manifest holds neither `name` nor `categories`. */
export const ITEM_MANIFEST_KEYS: readonly ['$schema', 'name', 'title', 'description', 'categories', 'recipes', 'composes']
/** A manifest's `name`, when it has one, against the folder it sits in, which names the item; [] when it matches or is absent. */
export function manifestNameProblems(manifest: unknown, folder: string): string[]
/** The keys of `manifest` that sit out of `ITEM_MANIFEST_KEYS`'s order, as one message; [] when in order. */
export function manifestOrderProblems(manifest: unknown): string[]
/** An item's manifest as a file holds it: `$schema` first, then `ITEM_MANIFEST_KEYS` in order, any other key after them, two-space JSON and a final newline. */
export function itemManifestText(manifest: Record<string, unknown>): string
/** The optional key of a tree listing the shared recipes its element wears, each a flat recipe; it renders nothing. A tree may hold only it. */
export const TREE_COMPOSES: 'composes'
/** The shared recipes an item's elements wear: each tree's `composes`, in tree order, then a top-level `composes` a stack's stored item may still carry; each once. */
export function composesOf(item: { recipes?: unknown; composes?: unknown }): string[]
/** The keys of a tree, in the order it is written: what it composes first, then its style. */
export const TREE_KEY_ORDER: readonly ['composes', 'base', 'variants', 'defaults', 'keepAxis']
/** Each tree whose keys run out of `TREE_KEY_ORDER`, one message per tree. */
export function treeOrderProblems(recipes: unknown): string[]
/** A tree with its keys in `TREE_KEY_ORDER`, any other key after them. */
export function orderedTree<T>(def: T): T
/** Recipes by name as a project's recipe file holds them: `$schema` first, the names in the order given, two-space JSON, a final newline. */
export function recipeFileText(recipes: Record<string, object>): string
/** Recipes read from their files, each name's file, and every problem as `<path>: <reason>` or `<path>: <name>: <reason>`. */
export interface RecipeFiles {
  flat: Record<string, RecipeDefinition>
  trees: Record<string, ComponentTree>
  paths: Record<string, string>
  problems: string[]
}
/** Whether a recipe file's object holds one recipe, the 0.9 shape, rather than recipes by name. */
export function isOneRecipeFile(value: Record<string, unknown>, path: string): boolean
/** Recipe files, each holding recipes by name. A file in the one-recipe shape defines nothing; a bad key leaves its siblings; of two files
 * defining one name, the first by path wins. */
export function readRecipeFiles(files: readonly { path: string; text: string }[]): RecipeFiles
/** What converting a library's one-recipe files writes and deletes, paths from the library root; only `problems` when it cannot. */
export interface RecipeConversion {
  writes: { path: string; text: string }[]
  removes: string[]
  problems: string[]
}
/** The 0.9 one-recipe files of a library's `recipes/` as files of recipes by name: each tree in its owning item's file, each flat recipe
 * in `recipes/shared/<name>.json`. A converted folder yields nothing; a folder holding both shapes yields a problem. */
export function convertRecipeFiles(files: readonly { path: string; text: string }[], itemNames: Iterable<string>): RecipeConversion
/** The file a recipe problem is about: the one defining the recipe name the line leads with (`fui-` or `recipe ` dropped). */
export function recipeFileOf(message: string, paths: Record<string, string>): string | undefined

/** Two values of different axes that both set one property, to different values, with no `with` pair of the two setting it. */
export interface AxisCollision {
  recipe: string
  /** `axis.value` of each, in the tree's axis order. */
  values: [string, string]
  /** The property's path through states, parts and steps, e.g. `hover.textColor`. */
  property: string
}
export function axisCollisions(recipes: { flat?: Record<string, unknown>; trees?: Record<string, unknown> } | undefined): AxisCollision[]
/** A name-to-recipe map as its flat recipes and its component trees. */
export function splitRecipes(components: unknown): { flat: Record<string, RecipeDefinition>; trees: Record<string, ComponentTree> }
export interface TreeEntry {
  /** The class is `fui-<name>`; a pair makes no class, its name carries its variables. */
  name: string
  layer: 'base' | 'value' | 'compound'
  /** Whether its layout properties render: true for every class a tree makes. */
  layout: boolean
  def: RecipeDefinition
  /** A pair's values by axis, in the tree's axis order. */
  when?: Record<string, string>
  /** A pair's value class names, in the tree's axis order: its rule nests in each, selecting the others. */
  classes?: string[]
}
/** The name part each axis value takes in a class, by axis then value: the bare value, or `<axis>-<value>` where another axis has it too or `keepAxis` lists it. */
export function valueParts(tree: unknown): Map<string, Map<string, string>>
/** A pair's name, which its variables carry: the tree's name and the pair's value parts, axes in the tree's order. */
export function pairName(name: string, tree: unknown, when: Record<string, string>, parts?: Map<string, Map<string, string>>): string
/** Every class a tree makes, in cascade order, with its resolved recipe, then every pair with the values it wears. */
export function treeEntries(name: string, tree: unknown, families?: Record<string, unknown>): TreeEntry[]
/** One resolved flat recipe per class a tree makes, keyed by its name (the class is `fui-<name>`), every use inlined. */
export function flattenTree(name: string, tree: unknown, families?: Record<string, unknown>): Record<string, RecipeDefinition>
/** Every reason a component tree would not render as written, as `<path>: <reason>`; [] when it renders whole. */
export function treeProblems(name: string, tree: unknown, families?: Record<string, unknown>): string[]
export interface RecipeVariable {
  /** The variable is `--fui-<recipe>-<suffix>`. */
  suffix: string
  declaration: string
  properties?: readonly string[]
  nested?: { selector: string; properties: readonly string[] }
  /** A layout step's key, `'@md'`: `properties` render inside its container query. */
  media?: LayoutStep
  /** A parts block's entry: the value's utility redeclares `--fui-<part>-<partSuffix>` as this variable; `properties` is empty. */
  part?: string
  partSuffix?: string
  /** On a tree's base: `--fui-<part>-<partSuffix>` is set to `declaration`, the part's own base value, so a nested tree starts clean; no variable of its own. */
  reset?: true
  /** A Reka popup keyword's: `properties` render `declaration` on the element, where Reka sets the variable it reads; no variable of its own. */
  local?: true
}
/** Every class the recipes make, with its sort layer and the variables it writes, then every pair with its values and classes; a tree's `{}` value writes none. */
export function recipeEntries(recipes?: {
  flat?: Record<string, unknown>
  trees?: Record<string, unknown>
}): ({ recipe: string; layer: TreeEntry['layer']; vars: RecipeVariable[] } & Pick<TreeEntry, 'when' | 'classes'>)[]
/** A property a table types: a keyword set, a token group, a colour, layout, a hide enum, translate, contain or the focus ring's colour. */
export function isTypedProperty(prop: string): boolean
/** Each untyped property the recipes set, as `<path>: <reason>`. It renders as written; a refused one is a problem, never a warning. */
export function designWarnings(recipes?: { flat?: Record<string, unknown>; trees?: Record<string, unknown> }): string[]
/** Every reason the recipes would not render as written, as `<path>: <reason>`: each flat recipe's, each tree's, then the set's. */
export function designProblems(recipes?: { flat?: Record<string, unknown>; trees?: Record<string, unknown> }): string[]
/** Every reason a whole set of recipes would not render as written, across recipes: two making one class, two classes
 * writing one variable, a pair written under both of its values, a parts block naming no part of its tree or a property the part's base
 * does not set. [] when every class and variable is its own. */
export function recipeSetProblems(recipes?: { flat?: Record<string, unknown>; trees?: Record<string, unknown> }): string[]
/** The item a tree belongs to: the longest item name that is the tree's name or prefixes it. */
export function treeOwner(tree: string, items: Iterable<string>): string | undefined
/** Why a recipe name is refused, or null. */
export function recipeNameProblem(name: string): string | null

export const TEXT_STEPS: readonly string[]
/** One text style's `steps` as CSS values per breakpoint, and the problems that keep a step out. */
export function textStepValues(name: string, steps: unknown): { values: Record<string, { fontSize?: string; lineHeight?: string }>; problems: string[] }
/** Every problem in a brand's text group's steps. */
export function textStepProblems(text: unknown): string[]

export type BrandCssScope = 'experience' | 'root' | 'project'

import type { ComponentTree, RecipeConversion, RecipeDefinition, RecipeFiles } from './recipe.mjs'

/** A project's recipes as its flat recipes and its component trees; `readRecipeFolder`'s result also carries `paths` and `problems`. */
export interface Recipes {
  flat?: Record<string, RecipeDefinition>
  trees?: Record<string, ComponentTree>
  /** Each recipe's file, relative to the library folder. */
  paths?: Record<string, string>
  /** Each file that cannot be read, as `<path>: <reason>`. */
  problems?: string[]
}

/** The recipe files under `dir`, read by `readRecipeFiles`; paths are relative to `root`, the library folder by default
 * (`recipes/card.json`). A missing `dir` holds no recipes. */
export function readRecipeFolder(dir: string, options?: { root?: string }): Promise<RecipeFiles>
/** Converts a library's `recipes/` to recipes by name in place, item names from its `registry.json`; with `check` it writes nothing. */
export function convertRecipeFolder(libraryDir: string, options?: { check?: boolean }): Promise<RecipeConversion>

/** The container sizes a brand may reference as `{container.<name>}`: Tailwind's scale, then each name of its own the scale lacks. */
export function containerNames(tokens: unknown): string[]

/** Tailwind's container scale, name to size, as a copy. */
export function defaultContainers(): Record<string, string>

/** A storefront platform's layout breakpoints, by `storefront.meta.source`: the fallback when a derive cannot read the shop's own. */
export const PLATFORM_BREAKPOINTS: Readonly<Record<string, Readonly<Record<string, string>>>>

/** Throws on a brand reference that does not resolve (`brandReferenceProblems`), each listed at its path, and on a declaration that would
 * still hold a brace, naming it. A reference stays a var() where its target declares a property of its own; elsewhere the resolved value. */
export function renderBaseCss(tokens: Record<string, unknown>, recipes?: Recipes, options?: { scope?: BrandCssScope }): string

export const PROJECT_STYLESHEET_HEADER: string

export function renderProjectStylesheet(tokens: Record<string, unknown>, recipes?: Recipes, options?: { fonts?: string[] }): string

export interface StylePreset {
  /** The file's stem in style-presets/. */
  readonly id: string
  readonly name: string
  readonly path: string
}

/** The brands a project can start its library from: every file in style-presets/, `default` first; read on each call. */
export function stylePresets(): readonly StylePreset[]

/** The preset's brand.json path; throws on an unknown id. */
export function stylePresetPath(id: string): string

export function buildBrandCss(contentDir: string, options?: { log?: (message: string) => void; scope?: BrandCssScope }): Promise<boolean>

export { isColorProperty, isRecipeDefinition, RECIPE_KEY, RECIPE_NAME, RECIPE_PARTS, RECIPE_PROPERTY, RECIPE_STATES, recipeValueProblem } from './recipe.mjs'
export type { RecipeState } from './recipe.mjs'
export const BRAND_STYLES: { text: Record<string, unknown>; border: Record<string, unknown>; ring: Record<string, unknown>; opacity: Record<string, unknown>; shadow: Record<string, unknown> }
/** A reference in a brand that does not resolve: `path` is where it is written (`color.edge.border`, `border.default.color`,
 * `shadow.sm.0.color`), `target` the token it names. */
export interface BrandReferenceProblem {
  readonly path: string
  /** `missing`: no token at `target`, or braces around something that is not a reference (`target` is then the value as written);
   * `cycle`: the reference is on a loop; `type`: `target`'s `$type` is not its slot's, both known. */
  readonly kind: 'missing' | 'cycle' | 'type'
  readonly target: string
}
/** `doc` with every `{group.token}` reference replaced by its target's value, through chains, in a token's `$value`, in a composite's
 * fields and in a text style's steps (at `text.<name>.$extensions.com.frontic.brand.steps.<at>.<field>`); a reference that fails, or whose target fails, stays as written, and only the root cause is a problem. Pure: `doc` is not changed. */
export function resolveBrand<T = Record<string, unknown>>(doc: T): { brand: T; problems: BrandReferenceProblem[] }
/** Each reference the brand writes that does not resolve, read as written: a hover the contract derives is no token yet, so a reference to
 * one is `missing`. `renderBaseCss` refuses a brand with any. */
export function brandReferenceProblems(brand: unknown): BrandReferenceProblem[]
/** Each problem as `<path>: {target}, <reason>`. */
export function brandReferenceLines(problems: readonly BrandReferenceProblem[]): string[]
/** The colours a component hovers, as `<group>.<name>`: the only ones the contract derives a hover for. */
export const HOVERED: readonly string[]
/** The brand with every BRAND_STYLES member it lacks and a hover for each HOVERED colour it writes none for, marked `$extensions["com.frontic.brand"].derived`:
 * one written as a reference to a colour with a hover takes that hover, as a reference to it; any other's is derived from its own base. Every hover the brand writes stays. */
export function withBrandStyles(tokens: Record<string, unknown>): Record<string, unknown>
/** The text-style and radius names the brand's theme defines, as `text-<name>` and `rounded-<name>` (`base`: bare `rounded`). */
export function brandUtilities(brand: unknown): { text: string[]; rounded: string[] }
/** The fontsource package each `font.family` token names in `$extensions['com.frontic.brand'].fontsource`, as `{ [package]: '*' }`. */
export function fontPackages(brand: unknown): Record<string, '*'>

/** A token pair below its WCAG 2.x contrast threshold: `action.primary / action.primary-foreground` at `ratio` where `needs` is required. */
export interface ContrastProblem {
  readonly pair: string
  readonly ratio: number
  readonly needs: number
}
/** Each opacity token whose value is not an integer from 0 to 100, as `opacity.<name>: <reason>`. */
export function brandOpacityProblems(tokens: unknown): string[]
/** Each container the brand names like one of Tailwind's own width keywords (`full`, `none`, `screen`, `auto`, …) or a bare number, a spacing step: a container of that name would override `w-`, `min-w-` or `max-w-<name>`. The stylesheet refuses such a brand. */
export function brandContainerProblems(tokens: unknown): string[]
/** Each colour name two colour groups both hold, a hover the contract derives included, as `<path>, <path>: both declare --fui-<name>; …`: the stylesheet declares one property per name, so one would override the other. The stylesheet refuses such a brand. */
export function brandColourNameProblems(tokens: unknown): string[]
/** The same duplicates structured: each name with every path that declares it, in the brand's order, and whether the contract derived that one. `brandColourNameProblems` is these as text. */
export function brandColourNameDuplicates(tokens: unknown): { name: string; at: { path: string; derived: boolean }[] }[]
/** Each colour name the stylesheet declares as `--fui-<name>`, with the group and token that own it: of two groups holding a name the later one, as the stylesheet's later declaration wins. It reads `tokens` as given: pass `withBrandStyles(brand)` to count the hovers the contract derives. The recipe token check and the recipe contrast read a colour name through it. */
export function colourOwners(tokens: unknown): Map<string, { group: string; token: { $value: unknown } }>
/** Every `<name>` / `<name>-foreground` pair of `color.action`, `status`, `commerce`, `surface` and `accent` below 4.5:1, and every
 * `color.edge` token below 3:1 against `surface.background`, sorted by group then name; a translucent token is composited first.
 * The brand is read through `withBrandStyles`; a derived hover is measured only where its base passes, so a failing base reports once. */
export function brandContrastProblems(brand: unknown, options?: { /** The ratio a text pair needs; 4.5 when omitted. The ring stays at 3. */ text?: number }): ContrastProblem[]

/** A recipe reference to a token the brand does not define: `at` is the path inside the recipe, as `hover.textColor`. */
export interface RecipeTokenProblem {
  recipe: string
  at: string
  ref: string
  /** A hover the brand leaves out that is not derived, because the derived hover would fall below AA on the foreground its base passes on. */
  underived?: { against: string; ratio: number }
}

/** Every recipe reference to a token the brand does not define, one per recipe and reference at its first path, sorted by recipe then path. A token the contract fills in by default, and a spacing, container or component reference, is never missing. */
export function recipeTokenProblems(recipes: { flat?: Record<string, unknown>; trees?: Record<string, unknown> } | undefined, brand: unknown): RecipeTokenProblem[]

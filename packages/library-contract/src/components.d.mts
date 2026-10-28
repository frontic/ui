import type { ComponentTree } from './recipe.mjs'

/** A cva call as written: its base argument, its config object and the line of the file it starts on. */
export type Cva = { base: unknown; config: Record<string, unknown>; line: number }
/** What each cva slot of a tree's component holds. */
export type CvaSlots = { base: string | null; variants: Record<string, Record<string, string>>; defaultVariants: Record<string, string> }
/** A component's files by path, each as its text. */
export type ComponentFiles = Record<string, string>
export type ComponentSite = { file: string; text: string; cva: Cva | null }
export type ComponentProblem = { file: string; line: number; message: string }

/** Every class-like token in a file's quoted strings. */
export function classTokens(text: string): Generator<string>
/** The class tokens each element of a file receives: one group per class attribute and per cva call. */
export function classGroups(source: string): string[][]
/** Every cva call of a file's script, its two arguments read literally. */
export function readCvas(text: string): Cva[]
/** What each cva slot of a tree's component holds; a pair is no slot. */
export function expectedClasses(name: string, tree: ComponentTree): CvaSlots
/** Each file parsed once: its cva calls and the class tokens its elements wear. */
export type ComponentIndex = { file: string; text: string; cvas: Cva[]; groups: string[][] }[]
export function indexComponents(files: ComponentFiles): ComponentIndex
/** The file a tree's class sits in: `main` when named, else the file whose cva base holds `fui-<name>`, else the cva holding its value classes, else one wearing it; null when none does. */
export function componentSite(name: string, source: ComponentFiles | ComponentIndex, options?: { main?: string; tree?: ComponentTree }): ComponentSite | null
/** Where a component differs from what its tree makes: the cva's base, each value and the defaults; a compoundVariants entry wears no recipe class.
 * With `utilityAxes`, a cva axis the tree lacks passes while its values wear utilities only. */
export function componentProblems(name: string, tree: ComponentTree, source: ComponentFiles | ComponentIndex, options?: { main?: string; site?: ComponentSite; utilityAxes?: boolean }): string[]
/** Every tree against the library's component files, one problem per mismatch; a tree no file wears is skipped. */
export function libraryComponentProblems(recipes: { trees?: Record<string, ComponentTree> }, files: ComponentFiles): ComponentProblem[]
/** Every shared recipe an element wears that no tree composes where it should: on one of the element's own trees, or on the item's root tree
 * `name` when the element carries none. One message per element and recipe. */
export function composesProblems(name: string, recipes: Record<string, unknown>, files: Record<string, string>, flat: Record<string, unknown>): string[]

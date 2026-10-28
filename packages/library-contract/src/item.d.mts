export type RegistryFile = { path: string; type: string }
export type ItemRef = { name: string; type: string; files?: RegistryFile[] }
export type ItemProblem = { path: string; message: string }
export type DeepImport = {
  specifier: string
  folder: string
  line: number
  column: number
  message: string
}

export const IMPORT: RegExp

export function itemFolder(item: Pick<ItemRef, 'name' | 'type'>): string | null
export function flatFile(item: Pick<ItemRef, 'name' | 'type'>): string | null
export function pascalName(name: string): string
export function mainFile(item: ItemRef): string | null
export function exampleFile(item: ItemRef): string | null
export function barrelFile(item: ItemRef): string | null
export function importCode(file: string, text: string): string
export function importTarget(file: string, specifier: string): string | null
export function deepImportProblems(file: string, text: string): DeepImport[]
export function forwardsAttrs(input: { examplePath: string; exampleText: string; folder: string; main: string }): boolean
export function itemShapeProblems(input: { item: ItemRef; files: Record<string, string | null | undefined> }): ItemProblem[]

export function importsOf(file: string, text: string): { specifier: string; line: number; column: number }[]

export function codeSpans(file: string, text: string): [number, number][]
export function importMask(file: string, text: string): string

export type RecipeOwner = { name: string; recipes?: Record<string, unknown>; composes?: readonly string[] }
export type RecipeItem = ItemRef & RecipeOwner

export function recipeMap(item: RecipeOwner): Record<string, string>

export function recipeClasses(text: string): string[]
export function recipeFiles(item: ItemRef): string[]
export function recipeClassProblems(registry: { items?: RecipeItem[] }, texts: Record<string, string | null | undefined>): ItemProblem[]

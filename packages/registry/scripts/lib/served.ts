import { importsOf } from '@frontic/library-contract/item'
import { importedPackages, packageName } from '@frontic/registry-client/api'
import { composesOf, parseExtends, type ComponentTree, WITH } from '@frontic/library-contract/recipe'
import { isFlatTier, type ItemType, type SourceItem } from './items'
import type { GenericRecipes } from './recipes'

export interface AuthoredEntry {
  name: string
  title?: string
  description?: string
  categories?: string[]
  /** The trees the item owns, by name; each names the shared recipes its element wears in its own `composes`. */
  recipes?: Record<string, unknown>
}
export type RecipeDefinition = Record<string, unknown>
export interface ServedFile {
  path: string
  type: string
  content: string
}
export interface ServedItem {
  name: string
  type: ItemType
  title?: string
  description?: string
  categories?: string[]
  dependencies?: string[]
  registryDependencies?: string[]
  files: ServedFile[]
  /** The trees the item owns, as authored. */
  recipes: Record<string, ComponentTree>
  /** Derived, never authored: the union of the trees' `composes`, served while {@link SERVE_COMPOSES_LIST} is on. */
  composes?: string[]
  /** What the item needs from the library beside its own trees: under `recipes`, each recipe it composes and every family its trees extend. */
  library?: { recipes: Record<string, RecipeDefinition | ComponentTree> }
}

const CODE = /\.[cm]?[jt]sx?$/
const LIBRARY_ITEM = /^@library\/(?:components\/(?:ui|sections|templates)|lib|composables)\/([a-z0-9-]+)(?:\/|$)/

function specifiers(files: Record<string, string>): string[] {
  return Object.entries(files).flatMap(([file, text]) => (file.endsWith('.vue') || CODE.test(file) ? importsOf(file, text).map((i) => i.specifier) : []))
}

export { importedPackages, packageName }

export function libraryDependencies(name: string, files: Record<string, string>): string[] {
  const names = specifiers(files).flatMap((s) => LIBRARY_ITEM.exec(s)?.[1] ?? [])
  return [...new Set(names)].filter((n) => n !== name).sort()
}

/** Every recipe an item brings, its own trees and the shared recipes, as `add` installs them. */
export const servedRecipes = (item: Pick<ServedItem, 'recipes' | 'library'>): Record<string, RecipeDefinition | ComponentTree> => ({ ...item.recipes, ...item.library?.recipes })

/** The families a tree's base, values and pairs use. */
export function usedFamilies(tree: ComponentTree): string[] {
  const blocks = (value: unknown): unknown[] => {
    const inner = typeof value === 'object' && value !== null && WITH in value ? (value as Record<string, unknown>)[WITH] : undefined
    const pairs =
      typeof inner === 'object' && inner !== null
        ? Object.values(inner as Record<string, unknown>).flatMap((values) => (typeof values === 'object' && values !== null ? Object.values(values) : []))
        : []
    return [value, ...pairs.flatMap(blocks)]
  }
  const values = [tree.base, ...Object.values(tree.variants ?? {}).flatMap((values) => Object.values(values))].flatMap(blocks)
  return values.flatMap((value) => parseExtends(value))
}

/** A dependency as served: pinned to the registry's own version when that is a prerelease, which `latest` never installs. */
export const servedDependency = (name: string, versions: Record<string, string>) => (/\d-/.test(versions[name] ?? '') ? `${name}@${versions[name]}` : name)

/** Whether a served item also lists, top level, the union of its trees' `composes`. Off: a served item carries composes
 * only inside its trees, and every reader takes the union with composesOf. */
export const SERVE_COMPOSES_LIST = false

export function servedItem(
  item: SourceItem,
  entry: AuthoredEntry,
  { flat, trees }: GenericRecipes,
  versions: Record<string, string> = {},
  { serveComposesList = SERVE_COMPOSES_LIST }: { serveComposesList?: boolean } = {},
): ServedItem {
  if (entry.name !== item.name) throw new Error(`the manifest entry for ${item.name} is named ${entry.name}`)
  const own = Object.keys(entry.recipes ?? {}).sort()
  const composes = composesOf(entry)
  const missing = [...own, ...composes].filter((r) => !Object.hasOwn(flat, r) && !Object.hasOwn(trees, r))
  if (missing.length) throw new Error(`${item.name} has ${missing.join(', ')}, which no recipe file defines`)
  const families = own.flatMap((r) => (Object.hasOwn(trees, r) ? usedFamilies(trees[r]!) : [])).filter((r) => Object.hasOwn(flat, r))
  const shared = [...new Set([...composes, ...families])].sort()
  const definition = (r: string) => structuredClone(Object.hasOwn(trees, r) ? trees[r]! : flat[r]!)
  const isExample = (rel: string) => rel.startsWith(`${item.name}.`) && rel.endsWith('.example.vue')
  const installed = Object.fromEntries(Object.entries(item.files).filter(([rel]) => !isExample(rel)))
  const dependencies = importedPackages(installed).map((name) => servedDependency(name, versions))
  const registryDependencies = libraryDependencies(item.name, installed)
  return {
    name: item.name,
    type: item.type,
    ...(entry.title ? { title: entry.title } : {}),
    ...(entry.description ? { description: entry.description } : {}),
    ...(entry.categories?.length ? { categories: entry.categories } : {}),
    ...(dependencies.length ? { dependencies } : {}),
    ...(registryDependencies.length ? { registryDependencies } : {}),
    files: Object.entries(item.files).map(([rel, content]) => ({
      path: isFlatTier(item.tier) ? `${item.tier}/${rel}` : `components/${item.tier}/${item.name}/${rel}`,
      type: isExample(rel) ? 'registry:example' : item.type,
      content,
    })),
    recipes: Object.fromEntries(own.map((r) => [r, definition(r) as ComponentTree])),
    ...(serveComposesList && composes.length ? { composes } : {}),
    ...(shared.length ? { library: { recipes: Object.fromEntries(shared.map((r) => [r, definition(r)])) } } : {}),
  }
}

/** Each served item's npm package that `declared` (the registry's own dependencies) lacks, as `<item> serves <package>`. */
export function undeclaredDependencies(served: ServedItem[], declared: string[]): string[] {
  return served.flatMap((item) =>
    (item.dependencies ?? []).filter((dep) => !declared.includes(packageName(dep))).map((dep) => `${item.name} serves ${dep}, which package.json does not list in dependencies`),
  )
}

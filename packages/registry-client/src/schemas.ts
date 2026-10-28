import { recipeProblems, splitRecipes, treeProblems, type ComponentTree, type RecipeDefinition } from '@frontic/library-contract/recipe'
import { z } from 'zod'
import { itemApiSchema } from './api'

export const ICON_LIBRARY_NAMES = ['lucide', 'tabler', 'hugeicons', 'phosphor', 'remixicon'] as const
export type IconLibraryName = (typeof ICON_LIBRARY_NAMES)[number]

const recipeKey = z.string().regex(/^[A-Za-z][A-Za-z0-9-]*$/)
const isNode = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value)

const recipesSchema = z.record(recipeKey, z.custom<ComponentTree | RecipeDefinition>(isNode, 'a recipe is a component tree or a block of properties'))

export const itemTypeSchema = z.enum(['registry:ui', 'registry:component', 'registry:block', 'registry:lib', 'registry:composable'])
export const fileSchema = z.object({ path: z.string(), type: z.string(), content: z.string() })
const servedItemSchema = z.object({
  name: z.string(),
  type: itemTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(fileSchema).min(1),
  /** The trees the item owns. */
  recipes: recipesSchema.optional(),
  /** A top-level list of the shared recipes the item wears, which only a stack's stored item may still carry; a served item names them in
   * each tree's own `composes`. composesOf reads both. */
  composes: z.array(recipeKey).optional(),
  /** What the item needs from the library beside its own trees: under `recipes`, each recipe its trees compose and every family they extend. */
  library: z.object({ recipes: recipesSchema }).optional(),
  /** Generated reference: parts with props, events, slots and the shared families they borrow, and the install command. */
  api: itemApiSchema.optional(),
})

// The item's trees and the shared recipes they use, held to the contract the registry build gates on.
export const itemSchema = servedItemSchema.superRefine((item, ctx) => {
  const { flat, trees } = splitRecipes({ ...item.recipes, ...item.library?.recipes })
  const at = (name: string) => (item.recipes && Object.hasOwn(item.recipes, name) ? ['recipes'] : ['library', 'recipes'])
  for (const [name, tree] of Object.entries(trees)) {
    for (const message of treeProblems(name, tree, flat)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...at(name), name], message })
  }
  for (const [name, def] of Object.entries(flat)) {
    for (const { path, message } of recipeProblems(def, name)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...at(name), name, ...(path ? path.split('.') : [])], message })
  }
})
export const indexEntrySchema = servedItemSchema.pick({ name: true, type: true, title: true, description: true, categories: true }).extend({ parts: z.array(z.string()).optional() })
export const indexSchema = z.object({ items: z.array(indexEntrySchema) })
export const iconMapSchema = z.record(
  z.string().regex(/^[A-Z][A-Za-z0-9]*Icon$/),
  z.object({ lucide: z.string(), tabler: z.string(), hugeicons: z.string(), phosphor: z.string(), remixicon: z.string() }).strict(),
)

export type RegistryItem = z.infer<typeof itemSchema>
export type RegistryFile = z.infer<typeof fileSchema>
export type IndexEntry = z.infer<typeof indexEntrySchema>
export type IconMap = z.infer<typeof iconMapSchema>
export interface SearchResults {
  pagination: { total: number; offset: number; limit: number; hasMore: boolean }
  items: IndexEntry[]
}

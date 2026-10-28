import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { recipeJsonSchema } from '@frontic/library-contract/recipe-schema'
import { recipeMap } from '@frontic/library-contract/item'
import { iconCoverageProblems, iconMapFromSource } from './build-icons'
import { itemApis } from './lib/api'
import { familyTableProblems, ownLook, servedFamilyTable, type FamilyTable, type ServedFamilyTable } from './lib/families'
import { readSourceItems, type SourceItem } from './lib/items'
import { defaultBrandNames, readRegistryRecipes, recipeDefinitionProblems, recipePlacementProblems, type RegistryRecipes } from './lib/recipes'
import { manifestPath, readManifests, REGISTRY } from './lib/manifests'
import { registryJsonSchema } from './lib/registry-schema'
import { servedItem, type ServedItem } from './lib/served'
import { servedFiles } from './lib/served-files'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

/** The registry's recipes, each file where its owner says and each recipe naming the default brand only; throws naming every problem. */
export async function readGenericRecipesFor(root: string): Promise<RegistryRecipes> {
  const recipes = readRegistryRecipes(root)
  const tiers = new Map(readSourceItems(root).map((item) => [item.name, item.tier]))
  const maps = readManifests(root)
    .entries.filter((entry) => tiers.has(entry.name))
    .map((entry) => ({ name: entry.name, tier: tiers.get(entry.name)!, recipes: recipeMap(entry) }))
  const problems = [...recipePlacementProblems(recipes, maps), ...recipeDefinitionProblems(recipes, defaultBrandNames())]
  if (problems.length) throw new Error(`recipe files:\n${problems.join('\n')}`)
  return recipes
}

/** The items the registry serves, in source order: every item not pending, each with its manifest's entry. `files` is what each serves of its source. */
export async function servedItems(root: string, files: (item: SourceItem) => Promise<Record<string, string>> = servedFiles): Promise<ServedItem[]> {
  const pending = new Set((await json<{ items: string[] }>(join(root, 'pending.json'))).items)
  const entries = new Map(readManifests(root).entries.map((e) => [e.name, e]))
  const source = readSourceItems(root)
  const names = new Set(source.map((i) => i.name))
  for (const name of [...entries.keys(), ...pending]) if (!names.has(name)) throw new Error(`${name} is listed but has no source under ui/, sections/, templates/, lib/ or composables/`)
  const listed = source.filter((i) => !pending.has(i.name))
  for (const item of listed) if (!entries.has(item.name)) throw new Error(`${item.name} has no manifest ${manifestPath(item.tier, item.name)}`)
  const recipes = await readGenericRecipesFor(root)
  const versions = existsSync(join(root, 'package.json')) ? ((await json<{ dependencies?: Record<string, string> }>(join(root, 'package.json'))).dependencies ?? {}) : {}
  const served: ServedItem[] = []
  for (const item of listed) served.push(servedItem({ ...item, files: await files(item) }, entries.get(item.name)!, recipes, versions))
  return served
}

/** The served v1/families.json: the authored groups, each with the served items derived into it. */
export async function familyTable(root: string, served: ServedItem[]): Promise<ServedFamilyTable> {
  const path = join(root, 'families.json')
  if (!existsSync(path)) throw new Error(`${path} is missing; the registry serves its family table`)
  const families = await json<FamilyTable>(path)
  const problems = familyTableProblems(families, Object.keys((await readGenericRecipesFor(root)).flat))
  if (problems.length) throw new Error(`families.json:\n${problems.join('\n')}`)
  return servedFamilyTable(families, served)
}

/** What the registry serves under v1/, by path: each item, the icon map, the family table with its members, the index and the registry. */
export async function contractFiles(root: string = ROOT): Promise<{ served: ServedItem[]; files: Record<string, unknown> }> {
  const served = await servedItems(root)
  const icons = await iconMapFromSource(root)
  const uncovered = iconCoverageProblems(icons, served)
  if (uncovered.length) throw new Error(`Icon map:\n${uncovered.join('\n')}`)
  const families = await familyTable(root, served)
  const apis = await itemApis(root, served)
  const withApi = served.map((item) => ({ ...item, api: apis[item.name]! }))
  const files: Record<string, unknown> = Object.fromEntries(withApi.map((item) => [`${item.name}.json`, item]))
  files['icons/index.json'] = icons
  files['families.json'] = families
  files['index.json'] = { items: served.map(({ name, type, title, description, categories }) => ({ name, type, title, description, categories, parts: apis[name]!.parts.map((part) => part.name) })) }
  files['registry.json'] = {
    ...REGISTRY,
    items: served.map(({ files, recipes: _recipes, library: _library, ...rest }) => ({ ...rest, files: files.map(({ path, type }) => ({ path, type })) })),
  }
  return { served, files }
}

/** Where the build writes what the registry serves at /v1/. */
export const OUT = join(ROOT, 'public', 'v1')

/** The recipe schema at the registry's root, `registry.ui.frontic.com/recipe.schema.json`: every recipe file names it in `$schema`, so it never moves with OUT. */
export const recipeSchemaPath = (root: string) => join(root, 'public', 'recipe.schema.json')

/** The manifest schema beside it, `registry.ui.frontic.com/item.schema.json`, which a manifest names once it leaves the repo. */
export const itemSchemaPath = (root: string) => join(root, 'public', 'item.schema.json')

/** The library registry schema beside them, `registry.ui.frontic.com/registry.schema.json`, which a stored library's registry.json names. */
export const registrySchemaPath = (root: string) => join(root, 'public', 'registry.schema.json')

export async function buildRegistry({ root = ROOT, out = OUT }: { root?: string; out?: string } = {}): Promise<ServedItem[]> {
  const { served, files } = await contractFiles(root)
  await rm(out, { recursive: true, force: true })
  for (const [path, data] of Object.entries(files)) {
    await mkdir(dirname(join(out, path)), { recursive: true })
    await writeFile(join(out, path), typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`)
  }
  await mkdir(dirname(recipeSchemaPath(root)), { recursive: true })
  await writeFile(recipeSchemaPath(root), `${JSON.stringify(recipeJsonSchema(), null, 2)}\n`)
  await writeFile(itemSchemaPath(root), await readFile(join(ROOT, 'item.schema.json'), 'utf8'))
  await writeFile(registrySchemaPath(root), `${JSON.stringify(registryJsonSchema(), null, 2)}\n`)
  return served
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildRegistry()
    .then(async (served) => {
      console.log(`✓ ${served.length} items under public/v1`)
      const own = ownLook(await json<ServedFamilyTable>(join(OUT, 'families.json')), served)
      console.log(`Own look (${own.length}): ${own.join(', ')}`)
    })
    .catch((error: Error) => {
      console.error(error.message)
      process.exit(1)
    })
}

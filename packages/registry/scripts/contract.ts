import { readFileSync } from 'node:fs'
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stylePresetPath } from '@frontic/library-contract/brand'
import { registryDependencies, UnknownLibraryImportError } from '@frontic/library-contract/dependencies'
import { itemShapeProblems, recipeClassProblems } from '@frontic/library-contract/item'
import { formatProblems, lintLibrary } from '@frontic/library-contract/lint'
import { typecheckLibrary } from '@frontic/library-contract/typecheck'
import { buildRegistry } from './build'
import { isTree, recipeFileOf, recipeFileText, splitRecipes, treeOwner } from '@frontic/library-contract/recipe'
import { contrastGate } from './lib/recipes'
import { servedRecipes, type ServedItem, undeclaredDependencies } from './lib/served'

export interface ContractProblem {
  file: string
  line: number
  column: number
  ruleId: string
  message: string
}

const RAW_TEXT = '@intlify/vue-i18n/no-raw-text'
const ROOT = resolve(import.meta.dirname, '..')

const DEPENDENCIES = Object.keys(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).dependencies ?? {})

const problem = (file: string, ruleId: string, message: string): ContractProblem => ({ file, line: 1, column: 1, ruleId, message })
const listed = (served: ServedItem[]) => ({
  name: 'frontic-ui',
  homepage: 'https://ui.frontic.com',
  items: served.map(({ files, library: _library, ...rest }) => ({ ...rest, files: files.map(({ path, type }) => ({ path, type })) })),
})

/** Every recipe the served items bring, later items over earlier ones, as `add` merges them. */
const allRecipes = (served: ServedItem[]): Record<string, object> => Object.assign({}, ...served.map(servedRecipes))

/** Where a stack library holds each recipe, the layout `lintLibrary` reads: a tree in its owning item's `recipes/<item>.json`, a flat recipe at `recipes/shared/<name>.json`. */
const recipePaths = (served: ServedItem[]) => {
  const items = served.map((item) => item.name)
  return Object.fromEntries(Object.entries(allRecipes(served)).map(([name, recipe]) => [name, isTree(recipe) ? `recipes/${treeOwner(name, items) ?? name}.json` : `recipes/shared/${name}.json`]))
}

/** Each recipe file a stack library holds for the served items: its recipes by name, the owner's own tree first, then its parts by name. */
function recipeFiles(served: ServedItem[]): Record<string, Record<string, object>> {
  const recipes = allRecipes(served)
  const files: Record<string, Record<string, object>> = {}
  for (const [name, path] of Object.entries(recipePaths(served)).sort(([a], [b]) => (a < b ? -1 : 1))) (files[path] ??= {})[name] = recipes[name]!
  for (const [path, held] of Object.entries(files)) {
    const own = path.slice(path.lastIndexOf('/') + 1, -5)
    if (Object.hasOwn(held, own)) files[path] = { [own]: held[own]!, ...held }
  }
  return files
}

/** The served items as a project library on the default brand, with the recipes they bring: what `new` gives a project. */
export async function materialize(served: ServedItem[], dir: string): Promise<string> {
  const content = join(dir, 'content')
  await rm(content, { recursive: true, force: true })
  const library = join(content, 'library')
  await mkdir(library, { recursive: true })
  await copyFile(stylePresetPath('default'), join(library, 'brand.json'))
  for (const [path, recipes] of Object.entries(recipeFiles(served))) {
    await mkdir(join(library, path, '..'), { recursive: true })
    await writeFile(join(library, path), recipeFileText(recipes))
  }
  await writeFile(join(library, 'registry.json'), `${JSON.stringify(listed(served), null, 2)}\n`)
  for (const item of served) {
    for (const file of item.files) {
      await mkdir(join(library, file.path, '..'), { recursive: true })
      await writeFile(join(library, file.path), file.content)
    }
  }
  return content
}

/** `dir` must sit under packages/registry/, where the items' packages resolve. */
export async function runContract({ served, dir }: { served: ServedItem[]; dir: string }) {
  const blocking: ContractProblem[] = []
  const registry = listed(served)
  const texts = Object.fromEntries(served.flatMap((item) => item.files.map((f) => [f.path, f.content])))
  let derived = new Map<string, string[]>()
  let derivable = true
  try {
    registryDependencies(registry, texts)
    derived = registryDependencies({ ...registry, items: registry.items.map((item) => ({ ...item, files: item.files.filter((f) => f.type !== 'registry:example') })) }, texts)
  } catch (error) {
    if (!(error instanceof UnknownLibraryImportError)) throw error
    derivable = false
    blocking.push(problem(`library/${error.message.split(' ')[0]}`, 'library/dependencies', error.message))
  }
  for (const item of served) {
    const folder = `library/${item.files[0]!.path.split('/').slice(0, 3).join('/')}`
    for (const p of itemShapeProblems({ item, files: texts })) blocking.push(problem(folder, 'library/item-shape', p.message))
    const stack = derived.get(item.name) ?? []
    const own = item.registryDependencies ?? []
    if (derivable && JSON.stringify(stack) !== JSON.stringify(own))
      blocking.push(problem('library/registry.json', 'library/dependencies', `${item.name} serves ${JSON.stringify(own)}; the contract derives ${JSON.stringify(stack)}`))
  }
  for (const message of undeclaredDependencies(served, DEPENDENCIES)) blocking.push(problem('library/registry.json', 'library/dependencies', message))
  for (const p of recipeClassProblems(registry, texts)) blocking.push(problem('library/registry.json', 'library/fui-classes', p.message))
  const paths = recipePaths(served)
  for (const { preset, line } of contrastGate(splitRecipes(allRecipes(served)))) blocking.push(problem(`library/${recipeFileOf(line, paths) ?? 'recipes'}`, 'library/contrast', `${preset}: ${line}`))
  const content = await materialize(served, dir)
  const workDir = join(dir, 'work')
  const lint = (await lintLibrary(content, { workDir: join(workDir, 'lint') })) as ContractProblem[]
  const { problems: types } = (await typecheckLibrary({ contentDir: content, workDir: join(workDir, 'types') })) as { problems: ContractProblem[] }
  blocking.push(...lint.filter((p) => p.ruleId !== RAW_TEXT), ...types)
  return { blocking, reported: lint.filter((p) => p.ruleId === RAW_TEXT) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = join(ROOT, '.contract')
  const served = await buildRegistry({ out: join(dir, 'public') })
  const { blocking, reported } = await runContract({ served, dir })
  if (reported.length) console.log(`${reported.length} raw-text findings (reported, not blocking):\n${formatProblems(reported)}`)
  if (blocking.length) {
    console.error(formatProblems(blocking))
    process.exit(1)
  }
  console.log(`✓ ${served.length} items pass the library gates`)
}

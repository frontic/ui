import { existsSync, promises as fs, readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import {
  brandColourNameProblems,
  brandContainerProblems,
  brandContrastProblems,
  brandOpacityProblems,
  brandReferenceLines,
  brandReferenceProblems,
  colourOwners,
  type ContrastProblem,
  fontPackages as brandFontPackages,
  HOVERED,
  type RecipeTokenProblem,
  recipeTokenProblems,
  renderProjectStylesheet,
  stylePresetPath,
} from '@frontic/library-contract/brand'
import { CONTRAST_STANDARDS, type ContrastPair, recipeContrastProblems as recipeContrastBelow } from '@frontic/library-contract/contrast'
import {
  designProblems,
  designWarnings,
  isTree,
  itemManifestText,
  manifestNameProblems,
  manifestOrderProblems,
  type RecipeFiles,
  readRecipeFiles,
  recipeFileOf,
  recipeFileText,
} from '@frontic/library-contract/recipe'
import { composesProblems } from '@frontic/library-contract/components'
import path from 'pathe'
import { glob } from 'tinyglobby'
import type { RegistryItem } from '@/src/registry'
import type { Config } from '@/src/schema'
import { getPackageInfo } from '@/src/utils/get-package-info'
import { logger } from '@/src/utils/logger'
import { updateDependencies } from '@/src/utils/updaters/update-dependencies'
import { resolveFilePath } from '@/src/utils/updaters/update-files'

export type Recipes = Record<string, unknown>

const isNode = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** The project's tokens; a missing or unreadable brand.json is an error naming it. */
export async function readBrand(config: Config): Promise<Record<string, unknown>> {
  const file = config.resolvedPaths.brand
  if (!existsSync(file)) throw new Error(`${file} is missing; run init --force to create it`)
  let tokens: unknown
  try {
    tokens = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`${file} is not JSON: ${(error as Error).message}`, { cause: error })
  }
  if (!isNode(tokens)) throw new Error(`${file} must hold an object of design tokens`)
  return tokens
}

/** The tiers whose items install into a folder of their own, each holding the item's manifest. */
export const COMPONENT_TIERS = ['ui', 'sections', 'templates'] as const

/** The folder `add` installs a tier's items into, resolved as `add` resolves their files. */
const tierFolder = (config: Config, tier: (typeof COMPONENT_TIERS)[number]) => path.dirname(resolveFilePath({ path: `components/${tier}/x` }, config))

/** Where `add` writes an item's manifest: `<name>.json` in the folder it installs the item's files into. A lib or composable item has none. */
export function manifestFile(item: Pick<RegistryItem, 'name' | 'files'>, config: Config): string | undefined {
  const tier = COMPONENT_TIERS.find((name) => item.files.some((file) => file.path.startsWith(`components/${name}/${item.name}/`)))
  return tier && path.join(tierFolder(config, tier), item.name, `${item.name}.json`)
}

/** A folder's entries; a missing folder holds none. */
const readFolder = (dir: string) =>
  fs.readdir(dir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return []
    throw error
  })

/** A project path as the project names it, from its root: `library/recipes/focus-ring.json`. */
const fromRoot = (config: Config, file: string) => path.relative(config.resolvedPaths.cwd, file)

/** Every installed component manifest, `<tier folder>/<name>/<name>.json`, with its text, and the name of every component folder. */
export async function readManifests(config: Config): Promise<{ manifests: { file: string; text: string }[]; folders: string[] }> {
  const manifests: { file: string; text: string }[] = []
  const folders: string[] = []
  for (const tier of COMPONENT_TIERS) {
    const dir = tierFolder(config, tier)
    if (tier !== 'ui' && path.resolve(dir) === path.resolve(config.resolvedPaths.ui)) continue
    const entries = await readFolder(dir)
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue
      folders.push(entry.name)
      const file = path.join(dir, entry.name, `${entry.name}.json`)
      if (existsSync(file)) manifests.push({ file, text: await fs.readFile(file, 'utf8') })
    }
  }
  return { manifests, folders }
}

/** The recipe files of the layout before 1.0, each as a problem naming it and saying what to run: a component tree in `library/recipes/`, or
 * any folder in it, `shared/` among them. */
function oldLayoutProblems(config: Config, shared: { file: string; text: string }[], folders: string[], components: string[]): string[] {
  const again = (names: string[]) => `run \`npx @frontic/ui add ${names.length ? names.join(' ') : '<component>'}\` again`
  const problems: string[] = []
  for (const folder of folders)
    problems.push(
      `${fromRoot(config, folder)}/: a folder of recipe files, the layout before 1.0; shared recipes sit directly in ${fromRoot(config, config.resolvedPaths.recipes)}/ and a component's trees in its own manifest: delete the folder and ${again(components)}`,
    )
  for (const { file, text } of shared) {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      continue
    }
    const value = parsed
    const trees = isNode(value) ? Object.keys(value).filter((name) => isTree(value[name])) : []
    if (!trees.length) continue
    const component = path.basename(file, '.json')
    problems.push(
      `${fromRoot(config, file)}: holds the component ${trees.length > 1 ? 'trees' : 'tree'} ${trees.join(', ')}, the layout before 1.0; a component's trees live in its manifest beside its files: delete this file and ${again([component])}`,
    )
  }
  return problems
}

/** The project's recipes: each installed component manifest's `recipes` and each file directly in `library/recipes/`, every path from the
 * project root. A name defined twice, a file that is not JSON, a tree composing what its item does not, and the layout before 1.0 are
 * problems naming the file. */
export async function readRecipes(config: Config): Promise<RecipeFiles> {
  const { manifests, folders: components } = await readManifests(config)
  const files: { path: string; text: string }[] = []
  const problems: string[] = []
  for (const { file, text } of manifests) {
    const at = fromRoot(config, file)
    let manifest: unknown
    try {
      manifest = JSON.parse(text)
    } catch (error) {
      problems.push(`${at}: not JSON: ${(error as Error).message}`)
      continue
    }
    if (!isNode(manifest)) problems.push(`${at}: holds the component's manifest, a JSON object`)
    else if (manifest.recipes !== undefined && !isNode(manifest.recipes)) problems.push(`${at}: recipes: holds the component's trees by name, a JSON object`)
    else {
      problems.push(...manifestNameProblems(manifest, path.basename(path.dirname(file))).map((problem) => `${at}: ${problem}`))
      files.push({ path: at, text: JSON.stringify(manifest.recipes ?? {}) })
    }
  }
  const dir = config.resolvedPaths.recipes
  const entries = await readFolder(dir)
  const shared: { file: string; text: string }[] = []
  const folders: string[] = []
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith('.')) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) folders.push(file)
    else if (entry.name.endsWith('.json')) shared.push({ file, text: await fs.readFile(file, 'utf8') })
  }
  const old = oldLayoutProblems(config, shared, folders, components)
  if (old.length) return { flat: {}, trees: {}, paths: {}, problems: old }
  const read = readRecipeFiles([...files, ...shared.map(({ file, text }) => ({ path: fromRoot(config, file), text }))])
  return { ...read, problems: [...problems, ...read.problems] }
}

/** Each contract message about the recipes, prefixed with the file it is about, or the recipes folder when it spans files. */
const atRecipeFile = (config: Config, paths: Record<string, string>, messages: string[]) =>
  messages.map((message) => `${recipeFileOf(message, paths) ?? fromRoot(config, config.resolvedPaths.recipes)}: ${message}`)

/** The recipe problems, as one error naming each; none is no error. */
const readProblems = (recipes: RecipeFiles): Error | undefined => (recipes.problems.length ? new Error(recipes.problems.join('\n')) : undefined)

/** A recipe and the file it is in, from the project root: `{ name: 'card-image', file: 'components/ui/card/card.json' }`. */
export interface PlannedRecipe {
  name: string
  file: string
}

export interface RecipePlan {
  writes: { path: string; text: string }[]
  added: PlannedRecipe[]
  replaced: PlannedRecipe[]
  kept: PlannedRecipe[]
}

/** The manifest keys `add` writes besides `recipes`, each kept from an existing manifest unless overwritten. */
const KEPT_KEYS = ['title', 'description'] as const

/** Where each item's recipes are written, per recipe: its own trees, each with its `composes`, into its manifest beside its files, each of
 * its `library.recipes` into `library/recipes/<name>.json`, or either into the file that already defines its name. A missing name is added
 * at the end of its file; a differing one is kept, or replaced in place with `overwrite`; the file's other names and their order stay. A
 * manifest's title and description are kept unless `overwrite`, and any other key it holds stays. Each touched file is written once, and a manifest only when it changes. A project
 * whose recipes cannot be read throws before anything is planned. */
export async function planRecipes(config: Config, items: RegistryItem[], { overwrite = false }: { overwrite?: boolean } = {}): Promise<RecipePlan> {
  const current = await readRecipes(config)
  const problem = readProblems(current)
  if (problem) throw problem
  const defined: Recipes = { ...current.flat, ...current.trees }
  const plan: RecipePlan = { writes: [], added: [], replaced: [], kept: [] }
  const changed = new Map<string, { replace: Recipes; add: Recipes; item?: RegistryItem }>()
  const change = (file: string) => changed.get(file) ?? changed.set(file, { replace: {}, add: {} }).get(file)!
  const place = (name: string, recipe: unknown, home: string) => {
    const file = Object.hasOwn(current.paths, name) ? path.join(config.resolvedPaths.cwd, current.paths[name]) : home
    const at = { name, file: fromRoot(config, file) }
    if (!Object.hasOwn(defined, name)) {
      change(file).add[name] = recipe
      plan.added.push(at)
    } else if (overwrite && !isDeepStrictEqual(defined[name], recipe)) {
      change(file).replace[name] = recipe
      plan.replaced.push(at)
    } else plan.kept.push(at)
  }
  const shared: Recipes = {}
  for (const item of items) {
    const manifest = manifestFile(item, config)
    if (manifest) {
      change(manifest).item = item
      for (const [name, recipe] of Object.entries(item.recipes ?? {})) place(name, recipe, manifest)
    }
    Object.assign(shared, Object.fromEntries(Object.entries(item.library?.recipes ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))))
  }
  for (const [name, recipe] of Object.entries(shared)) place(name, recipe, path.join(config.resolvedPaths.recipes, `${name}.json`))
  for (const [file, { replace, add, item }] of changed) {
    const existing = existsSync(file) ? (JSON.parse(await fs.readFile(file, 'utf8')) as Recipes) : undefined
    const withChanges = (recipes: Recipes) => {
      const next = Object.fromEntries(Object.entries(recipes).map(([name, recipe]) => [name, Object.hasOwn(replace, name) ? replace[name] : recipe]))
      return Object.assign(next, add)
    }
    if (isInside(config.resolvedPaths.recipes, file)) {
      const { $schema: _schema, ...recipes } = existing ?? {}
      plan.writes.push({ path: file, text: recipeFileText(withChanges(recipes) as Record<string, object>) })
      continue
    }
    const { $schema: _schema, ...before } = existing ?? {}
    const next: Recipes = { ...before }
    for (const key of KEPT_KEYS) {
      const incoming = item?.[key] as unknown
      if (item && (overwrite || !Object.hasOwn(before, key))) {
        if (incoming === undefined || (Array.isArray(incoming) && !incoming.length)) delete next[key]
        else next[key] = incoming
      }
    }
    next.recipes = withChanges(isNode(before.recipes) ? before.recipes : {})
    if (existing && isDeepStrictEqual(next, before)) continue
    plan.writes.push({ path: file, text: itemManifestText(next) })
  }
  return plan
}

const isInside = (dir: string, file: string) => {
  const relative = path.relative(dir, file)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

/** Writes each planned recipe file and manifest. */
export async function writeRecipes(writes: RecipePlan['writes']): Promise<void> {
  for (const { path: file, text } of writes) {
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, text, 'utf8')
  }
}

/** Each installed component manifest whose keys run out of order, from the project root, with the reason. */
export async function manifestOrder(config: Config): Promise<{ file: string; message: string }[]> {
  const out: { file: string; message: string }[] = []
  for (const { file, text } of (await readManifests(config)).manifests) {
    let manifest: unknown
    try {
      manifest = JSON.parse(text)
    } catch {
      continue
    }
    for (const message of manifestOrderProblems(manifest)) out.push({ file: fromRoot(config, file), message })
  }
  return out
}

/** Where each installed component manifest names its composes wrongly, as `check` warns about it: a top-level `composes`, which belongs in the
 * trees that wear it, and each element of the component's files wearing a shared recipe (one of `flat`) that no tree composes where it
 * should. Every file is from the project root. */
export async function manifestComposes(config: Config, flat: Record<string, unknown>): Promise<{ rule: 'manifest' | 'composes'; file: string; message: string }[]> {
  const out: { rule: 'manifest' | 'composes'; file: string; message: string }[] = []
  for (const { file, text } of (await readManifests(config)).manifests) {
    let manifest: unknown
    try {
      manifest = JSON.parse(text)
    } catch {
      continue
    }
    if (!isNode(manifest)) continue
    const at = fromRoot(config, file)
    if (Object.hasOwn(manifest, 'composes')) {
      out.push({ rule: 'manifest', file: at, message: 'composes: move composes into the trees that wear it, "<tree>": { "composes": [ … ] }' })
      continue
    }
    const folder = path.dirname(file)
    const files: Record<string, string> = {}
    for (const vue of await glob('**/*.vue', { cwd: folder })) files[fromRoot(config, path.join(folder, vue))] = await fs.readFile(path.join(folder, vue), 'utf8')
    const recipes = isNode(manifest.recipes) ? manifest.recipes : {}
    for (const problem of composesProblems(path.basename(folder), recipes, files, flat)) {
      const split = problem.indexOf(': ')
      out.push({ rule: 'composes', file: problem.slice(0, split), message: problem.slice(split + 2) })
    }
  }
  return out
}

/** Rewrites each manifest whose keys run out of order in the order `add` writes; returns each file it rewrote, from the project root. */
export async function fixManifestOrder(config: Config): Promise<string[]> {
  const fixed: string[] = []
  for (const { file } of await manifestOrder(config)) {
    const absolute = path.join(config.resolvedPaths.cwd, file)
    await fs.writeFile(absolute, itemManifestText(JSON.parse(await fs.readFile(absolute, 'utf8'))), 'utf8')
    fixed.push(file)
  }
  return fixed
}

/** brand.json and the recipe files, as the stylesheet renders them; a contract error in either throws, a brand one at its token path (a reference
 * that does not resolve and a colour name two groups write included), each recipe one naming its file. */
export async function readLibrary(config: Config): Promise<{ tokens: Record<string, unknown>; recipes: RecipeFiles }> {
  const tokens = await readBrand(config)
  const tokenProblems = [...brandReferenceLines(brandReferenceProblems(tokens)), ...brandColourNameProblems(tokens), ...brandOpacityProblems(tokens), ...brandContainerProblems(tokens)]
  if (tokenProblems.length) throw new Error(`library/brand.json:\n${tokenProblems.join('\n')}`)
  const recipes = await readRecipes(config)
  const problem = readProblems(recipes)
  if (problem) throw problem
  const problems = designProblems(recipes)
  if (problems.length) throw new Error(atRecipeFile(config, recipes.paths, problems).join('\n'))
  return { tokens, recipes }
}

/** Why a recipe's token reference does not resolve: a hover the brand leaves out that cannot be derived, the hover of a colour the contract
 * derives none for, or no such token in `brandFile`. */
export function recipeTokenMessage({ ref, underived }: RecipeTokenProblem, brandFile: string, tokens: Record<string, unknown>): string {
  if (underived) return `${ref} is not derived: a derived hover would fall to ${underived.ratio}:1 against ${underived.against}; set it in ${brandFile}`
  const base = /^\{colors\.([a-z0-9-]+)-hover(?:\/\d+)?\}$/.exec(ref)?.[1]
  const hovered = HOVERED.map((key) => key.split('.')[1])
  const owner = base ? colourOwners(tokens).get(base) : undefined
  if (!owner) return `${ref} is not in ${brandFile}`
  if (HOVERED.includes(`${owner.group}.${base}`)) return `${ref} is not in ${brandFile}: the contract derives none for ${base} here; write ${base}-hover in ${brandFile}`
  return `${ref} is not in ${brandFile}: the contract derives a hover only for the colours a component hovers (${hovered.join(', ')}); write ${base}-hover in ${brandFile} to give ${base} one`
}

/** The stylesheet and its warnings; a recipe naming a token the brand does not define throws, each at its file and path. */
async function render(config: Config): Promise<{ css: string; warnings: string[] }> {
  const { tokens, recipes } = await readLibrary(config)
  const brandFile = fromRoot(config, config.resolvedPaths.brand)
  const missing = recipeTokenProblems(recipes, tokens).map((problem) => `${problem.recipe}.${problem.at}: ${recipeTokenMessage(problem, brandFile, tokens)}`)
  if (missing.length) throw new Error(atRecipeFile(config, recipes.paths, missing).join('\n'))
  return { css: renderProjectStylesheet(tokens, recipes, { fonts: installedPackages(config) }), warnings: atRecipeFile(config, recipes.paths, designWarnings(recipes)) }
}

/** Renders frontic.css from brand.json and the recipe files and writes it when it changed; a contract error propagates and leaves the file.
 * `warnings` names each untyped recipe property, which renders as written, after the file that sets it. */
export async function compileStylesheet(config: Config): Promise<{ written: boolean; path: string; warnings: string[] }> {
  const file = config.resolvedPaths.fronticCss
  const { css, warnings } = await render(config)
  if (existsSync(file) && (await fs.readFile(file, 'utf8')) === css) return { written: false, path: file, warnings }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, css, 'utf8')
  return { written: true, path: file, warnings }
}

/** Whether frontic.css exists and matches a fresh render. */
export async function stylesheetCurrent(config: Config): Promise<boolean> {
  const file = config.resolvedPaths.fronticCss
  return existsSync(file) && (await fs.readFile(file, 'utf8')) === (await render(config)).css
}

export const FRONTIC_IMPORT = '@import "./frontic.css";'
const HAS_IMPORT = /@import\s+["']\.\/frontic\.css["']/
const TAILWIND_IMPORT = /^[^\S\n]*@import\s+["']tailwindcss["'][^\n]*$/m

/** Adds the frontic.css import to the global CSS, right after the tailwindcss import or at the top; returns whether the file changed. */
export async function ensureImport(config: Config): Promise<boolean> {
  const file = config.resolvedPaths.tailwindCss
  if (!existsSync(file)) throw new Error(`${file} is missing; components.json names it as the global CSS`)
  const css = await fs.readFile(file, 'utf8')
  if (HAS_IMPORT.test(css)) return false
  const tailwind = TAILWIND_IMPORT.exec(css)
  const next = tailwind ? `${css.slice(0, tailwind.index + tailwind[0].length)}\n${FRONTIC_IMPORT}${css.slice(tailwind.index + tailwind[0].length)}` : `${FRONTIC_IMPORT}\n${css}`
  await fs.writeFile(file, next, 'utf8')
  return true
}

/** The fontsource packages the brand names. */
export async function fontPackages(config: Config): Promise<string[]> {
  return Object.keys(brandFontPackages(await readBrand(config)))
}

/** The packages package.json lists; frontic.css imports a brand font only once its package is one of them. */
const installedPackages = (config: Config) => {
  const info = getPackageInfo(config.resolvedPaths.cwd, false)
  return Object.keys({ ...info?.dependencies, ...info?.devDependencies })
}

/** The brand's font packages package.json lacks, to install before frontic.css is written. */
export async function missingFonts(config: Config): Promise<string[]> {
  const installed = installedPackages(config)
  return (await fontPackages(config)).filter((name) => !installed.includes(name))
}

/** Installs the brand's missing font packages and returns them; a failed install warns and returns none, so frontic.css still
 * compiles and leaves those imports out. */
export async function installFonts(config: Config, options: { silent?: boolean } = {}): Promise<string[]> {
  const fonts = await missingFonts(config)
  try {
    await updateDependencies(fonts, config, options)
    return fonts
  } catch (error) {
    if (!options.silent) logger.warn(`Could not install ${fonts.join(', ')}: ${error instanceof Error ? error.message : String(error)}\nfrontic.css leaves them out; install them, then run build.`)
    return []
  }
}

/** The brand's token pairs below the contrast level components.json sets. */
export async function contrastProblems(config: Config): Promise<ContrastProblem[]> {
  return brandContrastProblems(await readBrand(config), { text: CONTRAST_STANDARDS[config.check.contrast].text })
}

/** The project's recipe colours below the contrast level components.json sets, on its own brand. */
export async function recipeContrastProblems(config: Config): Promise<ContrastPair[]> {
  return recipeContrastBelow(await readRecipes(config), await readBrand(config), { standard: config.check.contrast })
}

/** The default style preset's brand.json text. */
export const defaultBrand = () => readFileSync(stylePresetPath('default'), 'utf8')

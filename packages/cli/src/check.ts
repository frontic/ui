import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { brandContrastProblems, recipeTokenProblems, renderBaseCss } from '@frontic/library-contract/brand'
import { axisCollisions } from '@frontic/library-contract/recipe'
import { CONTRAST_STANDARDS, contrastLine, recipeContrastProblems } from '@frontic/library-contract/contrast'
import path from 'pathe'
import { glob } from 'tinyglobby'
import { manifestComposes, manifestOrder, readLibrary, recipeTokenMessage } from '@/src/library'
import { CHECK_RULES, type CheckRule, type Config } from '@/src/schema'

/** `file` is the project file a finding is about; `recipe` the recipe, when it is about one. */
export type Finding = { rule: FindingRule; severity: 'error' | 'warn'; where: string; message: string; file: string; recipe?: string }
/** What a finding is reported under: a rule components.json sets, or `design-md`, `manifest` and `composes`, which always warn. */
export type FindingRule = CheckRule | 'design-md' | 'manifest' | 'composes'
export const FINDING_RULES: readonly FindingRule[] = ['design-md', 'manifest', 'composes', ...CHECK_RULES]
export type CheckOptions = { contrast?: 'AA' | 'AAA'; strict?: boolean }

const SOURCES = ['**/*.{vue,ts,tsx}']
const BUILD_OUTPUT = ['**/node_modules/**', '**/.nuxt/**', '**/.output/**', '**/dist/**']
const RAW_TEXT = '@intlify/vue-i18n/no-raw-text'
const CACHE = 'node_modules/.cache/frontic-check'
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/** Every finding the project's rules ask for, and how many source files the lint read. A rule at `off` finds nothing; `strict` makes every warning an error. */
export async function runChecks(config: Config, options: CheckOptions): Promise<{ findings: Finding[]; files: number }> {
  const { cwd } = config.resolvedPaths
  const { rules } = config.check
  const standard = options.contrast ?? config.check.contrast
  const components = path.relative(cwd, config.resolvedPaths.components)
  if (components.startsWith('..') || path.isAbsolute(components)) throw new Error(`check lints inside the project only: aliases.components resolves to ${config.resolvedPaths.components}, outside the project ${cwd}`)
  if (!components) throw new Error('check needs aliases.components below the project root: it resolves to the project root, so every file would count as an installed item')
  const { tokens, recipes } = await readLibrary(config)
  const findings: Finding[] = []
  const add = (rule: CheckRule, where: string, message: string, at: { file: string; recipe?: string }) => {
    const severity = rules[rule]
    if (severity !== 'off') findings.push({ rule, severity: options.strict ? 'error' : severity, where, message, ...at })
  }
  const brandFile = path.relative(cwd, config.resolvedPaths.brand)
  const recipeFolder = path.relative(cwd, config.resolvedPaths.recipes)
  const inRecipe = (recipe: string) => ({ file: Object.hasOwn(recipes.paths, recipe) ? recipes.paths[recipe] : recipeFolder, recipe })
  const warn = (rule: 'design-md' | 'manifest' | 'composes', file: string, message: string) => findings.push({ rule, severity: options.strict ? 'error' : 'warn', where: file, message, file })

  const design = await readFile(config.resolvedPaths.design, 'utf8').catch(() => '')
  if (/^components:/m.test(FRONT_MATTER.exec(design)?.[1] ?? '')) {
    warn('design-md', path.relative(cwd, config.resolvedPaths.design), `components: is not compiled; recipes live in each component's manifest and in ${recipeFolder}/`)
  }
  for (const { file, message } of await manifestOrder(config)) warn('manifest', file, `${message}; check --fix rewrites it`)
  for (const { rule, file, message } of await manifestComposes(config, recipes.flat)) warn(rule, file, message)

  const files = await glob(SOURCES, { cwd, ignore: BUILD_OUTPUT })
  if (files.length) {
    const workDir = path.join(cwd, CACHE)
    await mkdir(workDir, { recursive: true })
    await writeFile(path.join(workDir, 'frontic.css'), renderBaseCss(tokens, recipes, { scope: 'root' }))
    const { lintWorkspace } = await import('@frontic/library-contract/lint')
    const brand = path.relative(cwd, config.resolvedPaths.brand)
    const layout = { sources: SOURCES, components, theme: `${CACHE}/frontic.css`, themeSource: `${brand}, the component manifests and ${recipeFolder}/` }
    for (const problem of await lintWorkspace(cwd, { workDir, layout })) {
      add(problem.ruleId === RAW_TEXT ? 'raw-text' : 'drift', `${problem.file}:${problem.line}:${problem.column}`, problem.message, { file: problem.file })
    }
  }

  for (const pair of recipeContrastProblems(recipes, tokens, { standard })) {
    const where = [pair.recipe, pair.at].filter(Boolean).join('.')
    add('contrast', where, contrastLine(pair).slice(where.length + 2), inRecipe(pair.recipe))
  }
  for (const { pair, ratio, needs } of brandContrastProblems(tokens, { text: CONTRAST_STANDARDS[standard].text })) {
    add('contrast', pair, `${ratio}:1, needs ${needs}:1`, { file: brandFile })
  }
  for (const problem of recipeTokenProblems(recipes, tokens)) add('missing-token', `${problem.recipe}.${problem.at}`, recipeTokenMessage(problem, brandFile, tokens), inRecipe(problem.recipe))
  for (const { recipe, values, property } of axisCollisions(recipes)) {
    add('axis-collision', recipe, `${values[0]} and ${values[1]} both set ${property} and no with pair decides; ${values[1]} wins by axis order`, inRecipe(recipe))
  }

  return { findings, files: files.length }
}

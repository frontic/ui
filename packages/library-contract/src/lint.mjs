// The library lint: theme classes only, container variants in components, no raw text there, props reaching Reka through useForwardProps.
import { createHash, randomBytes } from 'node:crypto'
import { glob, mkdir, readFile, readlink, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ESLint } from 'eslint'
import tailwind from 'eslint-plugin-better-tailwindcss'
import * as vueParser from 'vue-eslint-parser'
import * as astroParser from 'astro-eslint-parser'
import * as tsParser from '@typescript-eslint/parser'
import { buildBrandCss, readRecipeFolder } from './brand.mjs'
import { forwardedPropsProblems } from './forwarded-props.mjs'
import { PACKAGE_DIR, installedDir } from './resolve.mjs'
import { RAW_TEXT, RAW_TEXT_HINT, rawStringsConfig } from './rawStrings.mjs'
import { libraryComponentProblems } from './components.mjs'
import { designProblems, designWarnings, recipeFileOf } from './recipe.mjs'

const EXTENSIONS = '{vue,astro,ts,tsx}'
const LIBRARY_SOURCES = [`library/components/**/*.${EXTENSIONS}`]
const SOURCES = [`src/**/*.${EXTENSIONS}`, ...LIBRARY_SOURCES]
/** Where a content repo keeps its sources, its library components and the stylesheet that themes them. */
const CONTENT_LAYOUT = Object.freeze({ sources: SOURCES, components: 'library/components', theme: 'styles/base.css' })
const componentSources = (components) => [`${components}/**/*.${EXTENSIONS}`]
const TIERS = ['ui', 'sections', 'templates']
const containerScoped = (components) => TIERS.map((tier) => `${components}/${tier}/**/*.${EXTENSIONS}`)
const BUILD_OUTPUT = ['**/node_modules/**', '**/.nuxt/**', '**/.output/**', '**/dist/**']
const DEFAULT_BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl']

const UNKNOWN = 'better-tailwindcss/no-unknown-classes'
const RESTRICTED = 'better-tailwindcss/no-restricted-classes'

// Structural variants pick elements and carry no look: `has-[…]`, `not-has-[…]`, `group-has-[…]/name`, `[&>…]`, `[&_…]`.
// A sibling (`+`, `~`) is read only inside `has-[…]`; a child or descendant form starts on an element, never a combinator.
const BRACKETED = '\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])*\\]'
const ATTRIBUTE = '\\[(?:[^\\[\\]+~]|~=)*\\]'
const STRUCTURAL = `(?:(?:group-|not-)?has-${BRACKETED}(?:/[\\w-]+)?|\\[&(?:>|_)(?!_*[>+~])(?:[^\\[\\]+~]|${ATTRIBUTE})*\\])`
const VARIANTS = `!?(?:(?:[\\w@/.*-]+|${STRUCTURAL}):)+`

const ARBITRARY = [
  {
    pattern: `^(?!${VARIANTS}[^:]*$).*\\]:.*$`,
    message: '"$0" uses an arbitrary variant. Use a named variant (hover:, data-*:, aria-*:, @md:), a structural one (has-[…], [&>…], [&_…]) or a <style> block with var(--fui-*).',
  },
  {
    pattern: `^(?!(?:[\\w-]+:)*!?[\\w-]+-\\(--reka-[\\w-]+\\)!?$)(?!${VARIANTS}[^[(]*$).*(?:\\[|-\\().*$`,
    message: '"$0" uses an arbitrary value. Use a theme utility or a fui-* class, or a <style> block with var(--fui-*); only reka\'s own variables may be read as *-(--reka-*).',
  },
]

/** Data attributes reka sets on what it renders, which a component may key a bare `data-*:` variant on. */
export const VENDOR_DATA_ATTRIBUTES = Object.freeze(['disabled', 'highlighted', 'outside-view', 'selected', 'selection-end', 'selection-start', 'swiping', 'today', 'unavailable'])

/** The data attributes a file sets on what it renders: `data-x`, `:data-x="…"`, `'data-x': …`. A text scan by design: a name in
 * a comment counts, one set only from script (`setAttribute`) does not, and the allowlist they feed is workspace-wide. */
export function dataAttributeNames(source) {
  const names = new Set()
  for (const m of source.matchAll(/(?<![\w:.-])(?::|v-bind:)?data-([a-z][a-z0-9-]*)(?=\s*=|\s|\/?>)/g)) names.add(m[1])
  for (const m of source.matchAll(/['"]data-([a-z][a-z0-9-]*)['"]\s*:/g)) names.add(m[1])
  return [...names]
}

const SLOT_DATA_VARIANT = /(?<![\w-])\*{1,2}:data-([a-z][a-z0-9-]*):/g

/** The `data-*` variants the theme declares (`@custom-variant data-open`), without their `data-`. */
export const themeDataVariants = (baseCss) => [...baseCss.matchAll(/@custom-variant\s+data-([\w-]+)/g)].map((m) => m[1])

/** A bare `data-*:` variant, alone or as `group-`, `peer-`, `not-`, `in-` or `has-`, keyed on an attribute none of `names`. */
function dataVariantRestriction(names) {
  const known = [...new Set(names)].map(escapeRegex).join('|')
  return {
    pattern: `^(?:.*:)?(?:(?:group|peer|not|in|has)-)*data-(?!(?:${known})(?:/[\\w-]+)?:)[a-z][a-z0-9-]*(?:/[\\w-]+)?:.*$`,
    message:
      '"$0" keys on a data attribute nothing here sets. Use a theme state (data-open:, data-side-*:), one reka sets (data-disabled:, data-highlighted:) or one a component sets in its template.',
  }
}

const unknownHint = (themeSource) => `Use a utility from ${themeSource} or a fui-* class; stock Tailwind palette and scale classes are not available.`
const hintsFor = (layout) => ({ [UNKNOWN]: unknownHint(layout?.themeSource ?? 'the workspace theme (styles/base.css @theme)'), [RAW_TEXT]: RAW_TEXT_HINT })

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function viewportRestriction(breakpoints) {
  const names = breakpoints.map(escapeRegex).join('|')
  return {
    pattern: `^(?:.*:)?(?:not-)?(?:(?:max-|min-)?(?:${names})|portrait|landscape):.*$`,
    message: '"$0" uses a viewport variant. Library components size to their container: use a container variant like @md: (with @container on a parent).',
  }
}

/** Tailwind's breakpoints plus the theme's `--breakpoint-<name>`s; the theme adds names, it never resets. */
export function breakpointNames(baseCss) {
  const declared = [...baseCss.matchAll(/(?<![\w-])--breakpoint-([\w-]+)\s*:/g)].map((m) => m[1])
  return [...new Set([...DEFAULT_BREAKPOINTS, ...declared])]
}

/** Class selectors a file's `<style>` blocks define — the escape hatch, not unknown classes. */
export function styleBlockClasses(source) {
  const classes = new Set()
  for (const block of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = block[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '')
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1])
  }
  return [...classes]
}

const themeHashes = new Map()

// The plugin caches the design system by the entry file's mtime; base.css is only an import.
async function invalidateThemeCache(entryPoint, baseCss) {
  const hash = createHash('sha1').update(baseCss).digest('hex')
  if (themeHashes.get(entryPoint) === hash) return
  const now = new Date()
  await utimes(entryPoint, now, now)
  themeHashes.set(entryPoint, hash)
}

const ignoring = (files, classes) => ({
  files,
  rules: { [UNKNOWN]: ['error', { ignore: classes.map((c) => `^${escapeRegex(c)}$`) }] },
})

// A content repo's components folder holds only items; a project's also holds the app's own components, so only its tiers are items.
const itemSources = (layout, project) => (project ? containerScoped(layout.components) : componentSources(layout.components))
const inItems = (layout, project) => (file) => (project ? TIERS.some((tier) => file.startsWith(`${layout.components}/${tier}/`)) : file.startsWith(`${layout.components}/`))

function buildConfig({ layout, project, entryPoint, breakpoints, styleClasses, libraryStyleClasses, dataNames }) {
  const components = itemSources(layout, project)
  const restricted = [...ARBITRARY, dataVariantRestriction(dataNames)]
  return [
    {
      files: ['**/*.vue'],
      languageOptions: {
        parser: vueParser,
        parserOptions: { parser: tsParser, sourceType: 'module' },
      },
    },
    {
      files: ['**/*.astro'],
      languageOptions: {
        parser: astroParser,
        parserOptions: { parser: tsParser, sourceType: 'module' },
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      files: layout.sources,
      plugins: { 'better-tailwindcss': tailwind },
      settings: { 'better-tailwindcss': { entryPoint, cwd: PACKAGE_DIR } },
      linterOptions: { reportUnusedDisableDirectives: 'off', noInlineConfig: true },
      rules: {
        [UNKNOWN]: 'error',
        [RESTRICTED]: ['error', { restrict: restricted }],
      },
    },
    {
      files: containerScoped(layout.components),
      rules: {
        [RESTRICTED]: ['error', { restrict: [...restricted, viewportRestriction(breakpoints)] }],
      },
    },
    ignoring(layout.sources, styleClasses),
    // A library component renders in every experience, so it must not lean on one's styles.
    ignoring(components, libraryStyleClasses),
    rawStringsConfig(components.map((glob) => glob.replace(/\.\{[^}]+\}$/, '.vue'))),
  ]
}

async function sourceFiles(contentDir, patterns = SOURCES) {
  const found = []
  for await (const file of glob(patterns, { cwd: contentDir, exclude: BUILD_OUTPUT })) {
    found.push(file.split(path.sep).join('/'))
  }
  return found.sort()
}

const importOf = (from, file) => {
  const rel = path.relative(from, file).split(path.sep).join('/')
  return JSON.stringify(rel.startsWith('.') ? rel : `./${rel}`)
}

// The Tailwind plugin loads tailwindcss from the entry's folder, not from the cwd.
async function linkTailwind(workDir) {
  const target = installedDir('tailwindcss')
  const link = path.join(workDir, 'node_modules', 'tailwindcss')
  if ((await readlink(link).catch(() => null)) === target) return
  await mkdir(path.dirname(link), { recursive: true })
  // Swapped in by rename, so a lint already running never sees the link missing.
  const temp = `${link}-${process.pid}-${randomBytes(4).toString('hex')}`
  await symlink(target, temp, 'junction')
  await rename(temp, link).catch(async (error) => {
    await rm(temp, { force: true })
    throw error
  })
}

/** This package's Tailwind and tw-animate-css under the theme stylesheet: the theme the content builds with. */
async function lintEntry(workDir, theme) {
  if (typeof workDir !== 'string' || !path.isAbsolute(workDir)) {
    throw new Error('lint needs an absolute workDir outside the content repo')
  }
  await mkdir(workDir, { recursive: true })
  await linkTailwind(workDir)
  const entry = path.join(workDir, 'lint-entry.css')
  const css = [
    `@import ${importOf(workDir, path.join(installedDir('tailwindcss'), 'index.css'))};`,
    `@import ${importOf(workDir, path.join(installedDir('tw-animate-css'), 'dist', 'tw-animate.css'))};`,
    `@import ${importOf(workDir, theme)};`,
    '',
  ].join('\n')
  if ((await readFile(entry, 'utf8').catch(() => null)) !== css) await writeFile(entry, css)
  return entry
}

/** `{ file, line, column, ruleId, message, severity }[]` for the layout's sources, or just `files` (content-relative).
 * `workDir` holds the Tailwind entry; keep it out of the content repo. Without `layout` it lints a content repo
 * (`src/`, `library/components/`, `styles/base.css`) and leaves syntax errors to its build; with one it reports a script
 * that does not parse as a `parse` error, since a project has no other step that would. */
export async function lintWorkspace(contentDir, { files, workDir, layout } = {}) {
  const shape = layout ?? CONTENT_LAYOUT
  const workspace = await sourceFiles(contentDir, shape.sources)
  const targets = files ?? workspace
  if (!targets.length) return []
  const themePath = path.join(contentDir, shape.theme)
  const entryPoint = await lintEntry(workDir, themePath)
  const baseCss = await readFile(themePath, 'utf8').catch(() => '')
  await invalidateThemeCache(entryPoint, baseCss)

  const isItem = inItems(shape, Boolean(layout))
  // Workspace-wide: a parent styles its children's classes, and a class passes down as a prop.
  const styleClasses = new Set()
  const libraryStyleClasses = new Set()
  const dataNames = new Set([...VENDOR_DATA_ATTRIBUTES, ...themeDataVariants(baseCss)])
  for (const file of new Set([...workspace, ...targets])) {
    const source = await readFile(path.join(contentDir, file), 'utf8')
    for (const name of dataAttributeNames(source)) dataNames.add(name)
    // In a project, an installed component's `*:data-x:` / `**:data-x:` keys on slot content the page fills and marks.
    if (layout && isItem(file)) for (const m of source.matchAll(SLOT_DATA_VARIANT)) dataNames.add(m[1])
    for (const c of styleBlockClasses(source)) {
      styleClasses.add(c)
      if (isItem(file)) libraryStyleClasses.add(c)
    }
  }

  const eslint = new ESLint({
    cwd: contentDir,
    overrideConfigFile: true,
    overrideConfig: buildConfig({
      layout: shape,
      project: Boolean(layout),
      entryPoint,
      breakpoints: breakpointNames(baseCss),
      styleClasses: [...styleClasses].sort(),
      libraryStyleClasses: [...libraryStyleClasses].sort(),
      dataNames: [...dataNames].sort(),
    }),
  })
  const results = await eslint.lintFiles(targets)
  const hints = hintsFor(layout)
  return results.flatMap((result) =>
    result.messages
      .filter((m) => m.severity === 2 && (layout || !m.fatal))
      .map((m) => ({
        file: path.relative(contentDir, result.filePath).split(path.sep).join('/'),
        line: m.line,
        column: m.column,
        ruleId: m.fatal ? 'parse' : m.ruleId,
        message: hints[m.ruleId] ? `${m.message}. ${hints[m.ruleId]}` : m.message,
        severity: 'error',
      })),
  )
}

/** `lintWorkspace` over `library/components/` only, against a base.css rebuilt from the
 * brand.json and recipe files on disk: what a library save is gated on. */
export async function lintLibrary(contentDir, { log, workDir } = {}) {
  await buildBrandCss(contentDir, log ? { log } : {})
  const files = await sourceFiles(contentDir, LIBRARY_SOURCES)
  return [...(await recipeClassProblems(contentDir, files)), ...(await forwardingProblems(contentDir, files)), ...(await lintWorkspace(contentDir, { files, workDir }))]
}

export const FORWARDED_PROPS = 'frontic/forwarded-props'

async function forwardingProblems(contentDir, files) {
  const problems = []
  for (const file of files.filter((f) => f.endsWith('.vue'))) {
    for (const { line, part, binding } of forwardedPropsProblems(await readFile(path.join(contentDir, file), 'utf8'), file)) {
      problems.push({
        file,
        line,
        column: 1,
        ruleId: FORWARDED_PROPS,
        message: `${binding} is bound straight onto ${part}; pass it through useForwardProps or useForwardPropsEmits`,
        severity: 'error',
      })
    }
  }
  return problems
}

export const RECIPE_CLASSES = 'frontic/recipe-classes'

/** Each library component's cva against its recipe tree: a slot wearing anything but the class the tree makes is a problem on the cva's line;
 * a recipe file that cannot be read, or a recipe the contract refuses, is a problem on the first line of its file (`library/recipes` when
 * the problem spans files). */
async function recipeClassProblems(contentDir, files) {
  const recipes = await readRecipeFolder(path.join(contentDir, 'library', 'recipes'))
  const at = (message, severity, file = recipeFileOf(message, recipes.paths)) => ({ file: `library/${file ?? 'recipes'}`, line: 1, column: 1, ruleId: RECIPE_CLASSES, message, severity })
  if (recipes.problems.length) return recipes.problems.map((message) => at(message, 'error', message.slice(0, message.indexOf(': '))))
  const invalid = designProblems(recipes)
  if (invalid.length) return invalid.map((message) => at(message, 'error'))
  const warnings = designWarnings(recipes).map((message) => at(message, 'warning'))
  if (!Object.keys(recipes.trees).length) return warnings
  const components = {}
  for (const file of files) if (file.endsWith('.vue')) components[file] = await readFile(path.join(contentDir, file), 'utf8')
  const drift = libraryComponentProblems(recipes, components).map(({ file, line, message }) => ({ file, line, column: 1, ruleId: RECIPE_CLASSES, message, severity: 'error' }))
  return [...drift, ...warnings]
}

const MAX_LINES = 20

/** One `file:line:col rule message` line per problem, at most 20 plus a count of the rest. */
export function formatProblems(problems) {
  const lines = problems.slice(0, MAX_LINES).map((p) => `${p.file}:${p.line}:${p.column} ${p.ruleId} ${p.message}`)
  if (problems.length > MAX_LINES) lines.push(`… and ${problems.length - MAX_LINES} more`)
  return lines.join('\n')
}

/** The problems that fail a build; one without a severity is an error. */
export const lintErrors = (problems) => problems.filter((p) => p.severity !== 'warning')

/** The build-error dev.mjs reports, from the errors among `problems`; a warning never fails the build, so a list of warnings alone reports those. The first line names a file for the preview badge. */
export function lintFailure(problems) {
  const found = lintErrors(problems)
  const errors = found.length ? found : problems
  const lines = formatProblems(errors)
  const [first] = errors
  const err = new Error(`Class lint failed at ${first.file}:${first.line}:${first.column} (${errors.length} problem(s)), so the build did not run:\n${lines}`)
  err.logTail = lines
  return err
}

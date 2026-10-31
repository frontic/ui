import { compile } from 'tailwindcss'
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  recipeTokenProblems,
  PROJECT_STYLESHEET_HEADER,
  RECIPE_KEY,
  brandContainerProblems,
  brandContrastProblems,
  brandOpacityProblems,
  buildBrandCss,
  containerNames,
  defaultContainers,
  PLATFORM_BREAKPOINTS,
  fontPackages,
  readLibraryRecipeFiles,
  readLibraryRecipes,
  readRecipeFolder,
  renderBaseCss,
  renderProjectStylesheet,
  stylePresetPath,
} from '../src/brand.mjs'
import { readRecipeFiles } from '../src/recipe.mjs'
import { writeRecipes, yamlRecipes } from './yaml-recipes.mjs'

const DEFAULT_PRIMARY = new RegExp(`--fui-primary: ${JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')).color.action.primary.$value.hex};`)
const tokens = (primary) =>
  JSON.stringify({
    $extensions: {
      'com.frontic.brand': {
        version: 2,
        name: 't',
        generatedAt: '',
        logo: { desktop: null, mobile: null, favicon: null },
      },
    },
    color: { $type: 'color', action: { primary: { $value: primary } } },
    font: {
      family: { $type: 'fontFamily' },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: { $type: 'typography' },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
    breakpoint: { $type: 'dimension' },
  })

function content() {
  const dir = mkdtempSync(path.join(tmpdir(), 'bb-'))
  mkdirSync(path.join(dir, 'styles'))
  return dir
}

test("BB-01 the library checkout's brand.json builds base.css", async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'library'))
  writeFileSync(path.join(dir, 'library', 'brand.json'), tokens('#123456'))
  assert.equal(await buildBrandCss(dir), true)
  assert.match(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), /#123456/i)
})

test('BB-02 a legacy tokens/brand.json is never read — the default brand renders instead', async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'tokens'))
  writeFileSync(path.join(dir, 'tokens', 'brand.json'), tokens('#654321'))
  assert.equal(await buildBrandCss(dir), true)
  const css = readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8')
  assert.doesNotMatch(css, /#654321/i)
  assert.match(css, DEFAULT_PRIMARY)
})

test("BB-03 no library/brand.json renders the template's default brand, not an error", async () => {
  const dir = content()
  assert.equal(await buildBrandCss(dir), true)
  assert.match(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), DEFAULT_PRIMARY)
  // A second run against the same, unchanged default renders no-op.
  assert.equal(await buildBrandCss(dir), false)
})

test("BB-03b an unreadable library/brand.json falls back to the default brand and surfaces a warning to the caller's log", async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'library'))
  writeFileSync(path.join(dir, 'library', 'brand.json'), '{ not json')
  const logged = []
  assert.equal(await buildBrandCss(dir, { log: (msg) => logged.push(msg) }), true)
  assert.match(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), DEFAULT_PRIMARY)
  assert.ok(logged.some((m) => /library\/brand\.json is invalid/.test(m)))
})

test('BB-03c with no log callback, the same warning goes to console.error', async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'library'))
  writeFileSync(path.join(dir, 'library', 'brand.json'), '{ not json')
  const originalError = console.error
  const logged = []
  console.error = (msg) => logged.push(msg)
  try {
    assert.equal(await buildBrandCss(dir), true)
  } finally {
    console.error = originalError
  }
  assert.ok(logged.some((m) => /library\/brand\.json is invalid/.test(m)))
})

const designMd = (components) => `---\nname: T\ncomponents:\n${components}\n---\n\nbody\n`

test('BB-04 every recipe property becomes a --fui-<recipe>-<property> var', () => {
  const recipes = yamlRecipes(
    designMd(
      [
        '  button-primary:',
        "    backgroundColor: '{colors.primary}'",
        "    rounded: '{rounded.md}'",
        "    typography: '{typography.label}'",
        '    letterSpacing: wide',
        '  button-primary-hover:',
        "    backgroundColor: '{components.button-primary.backgroundColor}'",
        '  card:',
        "    rounded: '{rounded.base}'",
        "    border: '{border.default}'",
        "    shadow: '{shadow.md}'",
      ].join('\n'),
    ),
  )
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /--fui-button-primary-background-color: var\(--fui-primary\);/)
  assert.match(css, /--fui-button-primary-rounded: var\(--fui-radius-md\);/)
  assert.match(css, /--fui-button-primary-font-family: var\(--fui-text-label-family\);/)
  assert.match(css, /--fui-button-primary-font-size: var\(--fui-text-label-size\);/)
  assert.match(css, /--fui-button-primary-line-height: var\(--fui-text-label-line-height\);/)
  assert.match(css, /--fui-button-primary-font-weight: var\(--fui-text-label-weight\);/)
  assert.match(css, /--fui-button-primary-letter-spacing: 0\.025em;/)
  assert.match(css, /--fui-button-primary-hover-background-color: var\(--fui-button-primary-background-color\);/)
  assert.match(css, /--fui-card-rounded: var\(--fui-radius\);/)
  assert.match(css, /--fui-card-border: var\(--fui-border-default\);/)
  assert.match(css, /--fui-card-shadow: var\(--fui-shadow-md\);/)
})

test("BB-11 a text style's tracking and font features reach its vars and its recipes", () => {
  const brand = JSON.parse(tokens('#123456'))
  brand.text.label = {
    $value: {
      fontFamily: ['Inter'],
      fontSize: { value: 15, unit: 'px' },
      fontWeight: 600,
      lineHeight: 1.2,
    },
    $extensions: {
      'com.frontic.brand': { family: 'sans', letterSpacing: '-0.02em', fontFeature: 'tnum, ss01' },
    },
  }
  brand.text.plain = {
    $value: {
      fontFamily: ['Inter'],
      fontSize: { value: 15, unit: 'px' },
      fontWeight: 400,
      lineHeight: 1.5,
    },
  }
  const recipes = yamlRecipes(
    designMd(['  input-text:', "    typography: '{typography.label}'", "    placeholderColor: '{colors.primary}'", '    textTransform: uppercase', "    opacity: '{opacity.40}'"].join('\n')),
  )
  const css = renderBaseCss(brand, recipes)
  assert.match(css, /--fui-text-label-tracking: -0.02em;/)
  assert.match(css, /--fui-text-label-feature: "tnum", "ss01";/)
  assert.match(css, /--fui-text-label-variation: normal;/)
  assert.match(css, /--fui-text-plain-tracking: normal;/)
  assert.match(css, /--fui-input-text-letter-spacing: var\(--fui-text-label-tracking\);/)
  assert.match(css, /--fui-input-text-font-feature-settings: var\(--fui-text-label-feature\);/)
  assert.match(css, /--fui-input-text-placeholder-color: var\(--fui-primary\);/)
  assert.match(css, /--fui-input-text-text-transform: uppercase;/)
  assert.match(css, /--fui-input-text-opacity: var\(--fui-opacity-40\);/)
})

test('BB-12 an aliased text size and border colour resolve to the vars they name', () => {
  const brand = JSON.parse(tokens('#123456'))
  brand.font.size.lg = { $value: { value: 18, unit: 'px' } }
  brand.text.label = {
    $value: { fontFamily: ['Inter'], fontSize: '{font.size.lg}', fontWeight: 600, lineHeight: 1 },
  }
  brand.border.ink = {
    $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '{color.action.primary}' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--fui-text-label-size: var\(--fui-text-lg\);/)
  assert.match(css, /--fui-border-ink: 1px solid var\(--fui-primary\);/)
  assert.doesNotMatch(css, /: [^;]*\{[a-z]/)
})

test('BB-05 unknown refs and values that could leave the declaration are skipped', () => {
  const recipes = yamlRecipes(designMd(['  x:', "    backgroundColor: '{shadows.big}'", "    fontFamily: '1px; } body { color: red'", "    opacity: '{opacity.40}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.doesNotMatch(css, /--fui-x-background-color/)
  assert.doesNotMatch(css, /color: red/)
  assert.match(css, /--fui-x-opacity: var\(--fui-opacity-40\);/)
})

test('BB-06 no recipes renders exactly what tokens alone render', () => {
  const brand = JSON.parse(tokens('#123456'))
  assert.equal(renderBaseCss(brand, yamlRecipes(null)), renderBaseCss(brand))
  assert.equal(renderBaseCss(brand, yamlRecipes('---\nname: T\n---\n')), renderBaseCss(brand))
})

test('BB-06c a recipe file that is not JSON defines nothing, buildBrandCss logs it by path, and the brand still renders', async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'library', 'recipes'), { recursive: true })
  writeFileSync(path.join(dir, 'library', 'brand.json'), tokens('#123456'))
  writeFileSync(path.join(dir, 'library', 'recipes', 'x.json'), '{ "base": ')
  const logged = []
  assert.equal(await buildBrandCss(dir, { log: (message) => logged.push(message) }), true)
  assert.equal(logged.length, 1)
  assert.match(logged[0], /^recipes\/x\.json: not JSON: /)
  assert.equal(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), renderBaseCss(JSON.parse(tokens('#123456'))))
})

test('BB-07 buildBrandCss reads library/recipes/ next to brand.json, not DESIGN.md', async () => {
  const dir = content()
  mkdirSync(path.join(dir, 'library'))
  writeFileSync(path.join(dir, 'library', 'brand.json'), tokens('#123456'))
  await writeRecipes(path.join(dir, 'library'), "  badge:\n    textColor: '{colors.primary}'")
  writeFileSync(path.join(dir, 'library', 'DESIGN.md'), designMd("  chip:\n    textColor: '{colors.primary}'"))
  assert.equal(await buildBrandCss(dir), true)
  const css = readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8')
  assert.match(css, /--fui-badge-text-color: var\(--fui-primary\);/)
  assert.doesNotMatch(css, /fui-chip/)
})

test('BB-07a readRecipeFolder walks the folder for every JSON file, names paths from the library root, and reads a missing folder as none', async () => {
  const dir = content()
  const library = path.join(dir, 'library')
  mkdirSync(path.join(library, 'recipes', 'shared', 'deep'), { recursive: true })
  writeFileSync(path.join(library, 'recipes', 'card.json'), JSON.stringify({ card: { base: {} } }))
  writeFileSync(path.join(library, 'recipes', 'shared', 'deep', 'action.json'), JSON.stringify({ action: { rounded: '{rounded.md}' } }))
  writeFileSync(path.join(library, 'recipes', 'notes.txt'), 'not a recipe')
  writeFileSync(path.join(library, 'recipes', '.hidden.json'), '{')
  const read = await readRecipeFolder(path.join(library, 'recipes'))
  assert.deepEqual(read, {
    flat: { action: { rounded: '{rounded.md}' } },
    trees: { card: { base: {} } },
    paths: { card: 'recipes/card.json', action: 'recipes/shared/deep/action.json' },
    problems: [],
  })
  assert.deepEqual(await readRecipeFolder(path.join(dir, 'nope', 'recipes')), { flat: {}, trees: {}, paths: {}, problems: [] })
})

/** A library under `dir`: each `files` path, relative to `library/`, holding its JSON. */
function library(files) {
  const dir = content()
  for (const [file, value] of Object.entries(files)) {
    const full = path.join(dir, 'library', file)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, typeof value === 'string' ? value : JSON.stringify(value))
  }
  return dir
}

/** `files` as `readLibraryRecipeFiles` takes them: each path's JSON as text. */
function texts(files) {
  return Object.fromEntries(Object.entries(files).map(([file, value]) => [file, typeof value === 'string' ? value : JSON.stringify(value)]))
}

const HALF_MIGRATED = {
  'recipes/shared/action.json': { action: { rounded: '{rounded.md}' } },
  'recipes/card.json': { card: { base: {} } },
  'recipes/focus-ring.json': { 'focus-ring': { ringWidth: '{ring.2}' } },
  'recipes/notes.txt': 'not a recipe',
  'recipes/.hidden.json': '{',
  'components/ui/tag/tag.json': { title: 'Tag', recipes: { tag: { base: {} } } },
  'components/ui/tag/Tag.vue': '<template><span /></template>',
  'components/ui/plain/plain.json': { title: 'Plain' },
}

test('BB-07c readLibraryRecipeFiles reads a half-migrated library whole: recipes/ in either layout and the trees in component manifests', () => {
  assert.deepEqual(readLibraryRecipeFiles(texts(HALF_MIGRATED)), {
    flat: { action: { rounded: '{rounded.md}' }, 'focus-ring': { ringWidth: '{ring.2}' } },
    trees: { card: { base: {} }, tag: { base: {} } },
    paths: { action: 'recipes/shared/action.json', card: 'recipes/card.json', 'focus-ring': 'recipes/focus-ring.json', tag: 'components/ui/tag/tag.json' },
    problems: [],
  })
  assert.deepEqual(readLibraryRecipeFiles({}), { flat: {}, trees: {}, paths: {}, problems: [] })
})

const DUPLICATED = {
  'recipes/shared/action.json': { action: { rounded: '{rounded.md}' } },
  'recipes/action.json': { action: { rounded: '{rounded.lg}' } },
  'recipes/tag.json': { tag: { base: {} } },
  'recipes/broken.json': '{',
  'components/ui/tag/tag.json': { recipes: { tag: { base: { opacity: '{opacity.50}' } } } },
  'components/ui/broken/broken.json': '{',
  'components/ui/odd/odd.json': { recipes: [] },
  'components/ui/list/list.json': [],
}

test('BB-07d readLibraryRecipeFiles names both files of a recipe defined twice, and each file it cannot parse', () => {
  const { problems } = readLibraryRecipeFiles(texts(DUPLICATED))
  assert.deepEqual(
    problems.sort(),
    [
      'components/ui/broken/broken.json: not JSON',
      'components/ui/list/list.json: holds an item’s manifest, a JSON object',
      'components/ui/odd/odd.json: recipes: holds the item’s trees by name, a JSON object',
      readRecipeFiles([{ path: 'recipes/broken.json', text: '{' }]).problems[0],
      'recipes/shared/action.json: action: defined in recipes/action.json too',
      'recipes/tag.json: tag: defined in components/ui/tag/tag.json too',
    ].sort(),
  )
})

test('BB-07f readLibraryRecipeFiles keeps the new layout’s recipe of a name defined twice, however the paths sort', () => {
  const read = readLibraryRecipeFiles(
    texts({
      'recipes/button.json': { button: { rounded: '{rounded.lg}' } },
      'recipes/shared/button.json': { button: { rounded: '{rounded.sm}' } },
      'recipes/tag.json': { tag: { rounded: '{rounded.lg}' } },
      'recipes/shared/tag.json': { tag: { rounded: '{rounded.sm}' } },
      'recipes/card.json': { card: { base: { opacity: '{opacity.50}' } } },
      'components/ui/card/card.json': { recipes: { card: { base: {} } } },
    }),
  )
  assert.deepEqual(read.flat, { button: { rounded: '{rounded.lg}' }, tag: { rounded: '{rounded.lg}' } })
  assert.deepEqual(read.trees, { card: { base: {} } })
  assert.deepEqual(read.paths, { button: 'recipes/button.json', tag: 'recipes/tag.json', card: 'components/ui/card/card.json' })
  assert.deepEqual(read.problems.sort(), [
    'recipes/card.json: card: defined in components/ui/card/card.json too',
    'recipes/shared/button.json: button: defined in recipes/button.json too',
    'recipes/shared/tag.json: tag: defined in recipes/tag.json too',
  ])
})

test('BB-07h readLibraryRecipes reads a library folder as readLibraryRecipeFiles reads the same files, and a missing library as none', async () => {
  for (const files of [HALF_MIGRATED, DUPLICATED]) {
    const read = await readLibraryRecipes(library(files))
    const expected = readLibraryRecipeFiles(texts(files))
    assert.deepEqual({ ...read, problems: read.problems.sort() }, { ...expected, problems: expected.problems.sort() })
  }
  assert.deepEqual(await readLibraryRecipes(path.join(content(), 'nope')), { flat: {}, trees: {}, paths: {}, problems: [] })
})

test('BB-07g readLibraryRecipes names a manifest it cannot read as a problem and reads the rest', async () => {
  const dir = library({ 'recipes/card.json': { card: { base: {} } } })
  mkdirSync(path.join(dir, 'library', 'components', 'ui', 'odd', 'odd.json'), { recursive: true })
  const read = await readLibraryRecipes(dir)
  assert.deepEqual(read.paths, { card: 'recipes/card.json' })
  assert.deepEqual(read.problems, ['components/ui/odd/odd.json: cannot be read (EISDIR)'])
})

test('BB-07e buildBrandCss renders the trees a component manifest holds', async () => {
  const dir = library({ 'brand.json': tokens('#123456'), 'components/ui/tag/tag.json': { recipes: { tag: { base: { ringColor: '{colors.primary}' } } } } })
  assert.equal(await buildBrandCss(dir), true)
  assert.match(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), /--fui-tag-ring-color: var\(--fui-primary\);/)
})

test('BB-07b readRecipeFolder follows a symlinked folder or file, and a link back into the folder is read once', async () => {
  const dir = content()
  const brand = path.join(dir, 'brand-shared')
  mkdirSync(brand, { recursive: true })
  writeFileSync(path.join(brand, 'action.json'), JSON.stringify({ action: { rounded: '{rounded.md}' } }))
  writeFileSync(path.join(dir, 'card.json'), JSON.stringify({ card: { base: {} } }))
  const recipes = path.join(dir, 'library', 'recipes')
  mkdirSync(recipes, { recursive: true })
  symlinkSync(brand, path.join(recipes, 'shared'))
  symlinkSync(path.join(dir, 'card.json'), path.join(recipes, 'card.json'))
  symlinkSync(recipes, path.join(brand, 'loop'))
  const read = await readRecipeFolder(recipes)
  assert.deepEqual(read.paths, { card: 'recipes/card.json', action: 'recipes/shared/action.json' })
  assert.deepEqual(read.problems, [])
})

test('BB-07c readRecipeFolder names a symlink whose target is missing as a problem and reads the rest', async () => {
  const dir = content()
  const recipes = path.join(dir, 'library', 'recipes')
  mkdirSync(recipes, { recursive: true })
  writeFileSync(path.join(recipes, 'card.json'), JSON.stringify({ card: { base: {} } }))
  symlinkSync(path.join(dir, 'gone.json'), path.join(recipes, 'button.json'))
  symlinkSync(path.join(dir, 'gone-folder'), path.join(recipes, 'shared'))
  symlinkSync(path.join(dir, 'gone.md'), path.join(recipes, 'notes.md'))
  const read = await readRecipeFolder(recipes)
  assert.deepEqual(read.paths, { card: 'recipes/card.json' })
  assert.deepEqual(read.problems, ['recipes/button.json: a symlink whose target is missing (ENOENT)', 'recipes/shared: a symlink whose target is missing (ENOENT)'])
})

test("BB-08 a ref-shaped value that isn't a clean identifier emits no var", () => {
  const recipes = yamlRecipes(designMd('  x:\n    backgroundColor: \'{colors.a); content: "pwned"; --evil: (}\''))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.doesNotMatch(css, /--fui-x-background-color/)
  assert.doesNotMatch(css, /content:/)
})

test("BB-09 a property key that isn't a clean identifier closes no declaration", () => {
  const recipes = { flat: { x: { 'color: red; } body { color': 'red' } } }
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.doesNotMatch(css, /body \{ color: red/)
  assert.doesNotMatch(css, /--fui-x-color: red;\n\s*\}\s*body/)
})

test("BB-10 a recipe key that isn't a clean identifier is dropped entirely", () => {
  const recipes = { flat: { 'x:red;}body{color': { opacity: '{opacity.100}' } }, trees: { 'y:red;}body{color': { base: { opacity: '{opacity.100}' } } } }
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.doesNotMatch(css, /body\{color/)
})

test('BB-11 the @theme block resets the stock palette before mapping colours', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')))
  assert.match(css, /@theme inline \{\n {2}--color-\*: initial;/)
  assert.match(css, /--radius-\*: initial;/)
  assert.match(css, /--shadow-\*: initial;/)
  assert.match(css, /--text-\*: initial;/)
})

test("BB-12 a colour token maps onto Tailwind's --color-* namespace", () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')))
  assert.match(css, /--color-primary: var\(--fui-primary\);/)
})

test('BB-13 font slots map onto --font-* and set the default font family', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily', sans: { $value: ['Inter'] }, heading: { $value: ['Oswald'] } },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: { $type: 'typography' },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--default-font-family: var\(--fui-font-sans\);/)
  assert.match(css, /--font-sans: var\(--fui-font-sans\);/)
  assert.match(css, /--font-heading: var\(--fui-font-heading\);/)
  assert.match(css, /--font-body: var\(--fui-text-body-family\);/)
  assert.match(css, /--fui-text-body-family: Inter;/)
})

test('BB-14 a text style maps its size, line-height, weight and paired font family', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily' },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: {
      $type: 'typography',
      body: {
        $value: {
          fontFamily: ['Inter'],
          fontSize: { value: 1, unit: 'rem' },
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
    },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--text-body: var\(--fui-text-body-size\);/)
  assert.match(css, /--text-body--line-height: var\(--fui-text-body-line-height\);/)
  assert.match(css, /--text-body--font-weight: var\(--fui-text-body-weight\);/)
  assert.match(css, /--font-body: var\(--fui-text-body-family\);/)
})

test('BB-14b a style named like a family slot keeps its --text-*, the slot its --font-*; a font-size step name emits no override', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily', sans: { $value: ['Inter'] } },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension', lg: { $value: { value: 1.2, unit: 'rem' } } },
    },
    text: {
      $type: 'typography',
      sans: {
        $value: {
          fontFamily: ['Inter'],
          fontSize: { value: 1, unit: 'rem' },
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
      lg: {
        $value: {
          fontFamily: ['Inter'],
          fontSize: { value: 1, unit: 'rem' },
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
    },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--text-sans: var\(--fui-text-sans-size\);/)
  assert.doesNotMatch(css, /--text-lg--line-height/)
  assert.match(css, /--font-sans: var\(--fui-font-sans\);/)
  assert.doesNotMatch(css, /--font-sans: var\(--fui-text-sans-family\);/)
  assert.doesNotMatch(css, /--font-lg/)
  assert.match(css, /--text-lg: var\(--fui-text-lg\);/)
})

test('BB-15 radius maps base onto bare --radius and named steps onto --radius-*', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily' },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: { $type: 'typography' },
    radius: {
      $type: 'dimension',
      base: { $value: { value: 0.5, unit: 'rem' } },
      lg: { $value: { value: 0.75, unit: 'rem' } },
    },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--radius: var\(--fui-radius\);/)
  assert.match(css, /--radius-lg: var\(--fui-radius-lg\);/)
})

test('BB-16 a shadow maps onto --shadow-* as a literal Tailwind can recolour', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily' },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: { $type: 'typography' },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: {
      $type: 'shadow',
      md: {
        $value: [
          {
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 4, unit: 'px' },
            blur: { value: 16, unit: 'px' },
            spread: { value: 0, unit: 'px' },
            color: '#000000',
          },
        ],
      },
    },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--shadow-md: 0px 4px 16px 0px #000000;/)
  assert.match(css, /--fui-shadow-md: 0px 4px 16px 0px #000000;/)
  assert.match(css, /--inset-shadow-\*: initial;/)
  assert.match(css, /--drop-shadow-\*: initial;/)
  assert.match(css, /--inset-shadow-md: inset 0px 4px 16px 0px #000000;/)
  assert.match(css, /--drop-shadow-md: 0px 4px 8px #000000;/)
})

test("BB-17 --fui-spacing is Tailwind's default when brand.json has no spacing group, else the brand's value, and --spacing stays single-sourced through it", () => {
  const withoutSpacing = JSON.parse(tokens('#123456'))
  const defaults = renderBaseCss(withoutSpacing)
  assert.match(defaults, /--fui-spacing: 0\.25rem;/)
  assert.match(defaults, /--spacing: var\(--fui-spacing\);/)

  const withSpacing = {
    ...withoutSpacing,
    spacing: { $type: 'dimension', base: { $value: { value: 0.3, unit: 'rem' } } },
  }
  const css = renderBaseCss(withSpacing)
  assert.match(css, /--fui-spacing: 0\.3rem;/)
  assert.match(css, /--spacing: var\(--fui-spacing\);/)
})

test("BB-18 --breakpoint-* falls back to Tailwind's scale when empty, else the brand's own", () => {
  const empty = JSON.parse(tokens('#123456'))
  const defaults = renderBaseCss(empty)
  assert.match(defaults, /--breakpoint-sm: 40rem;/)
  assert.match(defaults, /--breakpoint-2xl: 96rem;/)

  const overridden = {
    ...empty,
    breakpoint: { $type: 'dimension', sm: { $value: { value: 30, unit: 'rem' } } },
  }
  const css = renderBaseCss(overridden)
  assert.match(css, /--breakpoint-sm: 30rem;/)
  assert.doesNotMatch(css, /--breakpoint-md/)
})

// Tailwind as a project loads it, its theme included.
const TAILWIND = path.dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))
const withTailwind = async (css, candidates) =>
  (
    await compile(`@import "tailwindcss";\n${css}`, {
      base: TAILWIND,
      loadStylesheet: async (id, base) => {
        const file = id === 'tailwindcss' ? path.join(TAILWIND, 'index.css') : path.resolve(base, id)
        return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') }
      },
    })
  ).build(candidates)
const maxWidth = (css, name) => css.match(new RegExp(`\\.max-w-${name} \\{\\s*max-width: ([^;]+);`))?.[1]
const withContainers = (container) => ({ ...JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), container: { $type: 'dimension', ...container } })

test('an experience root in the light DOM takes preflight’s document defaults itself, its font the brand’s', async () => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const css = await withTailwind(renderBaseCss(brand, {}, { scope: 'experience' }).replace(/^@import[^;]*;\n?/gm, ''), [])
  const rule = (selector) => {
    const start = css.indexOf(`${selector} {`)
    assert.ok(start >= 0, selector)
    return Object.fromEntries([...css.slice(start, css.indexOf('}', start)).matchAll(/^\s*([\w-]+): ([^;]+);/gm)].map(([, property, value]) => [property, value]))
  }
  const root = rule(':where(.frontic-experience-root)')
  assert.match(root['font-family'], /^var\(--fui-font-sans,/)
  assert.deepEqual(root, rule('html, :host'), 'the same declarations as preflight’s')
  assert.equal(
    css
      .slice(0, css.indexOf(':where(.frontic-experience-root) {'))
      .match(/@layer \w+ \{/g)
      .at(-1),
    '@layer base {',
  )
  for (const scope of ['root', 'project']) assert.doesNotMatch(renderBaseCss(brand, {}, { scope }), /\.frontic-experience-root/, scope)
})

test('a container named like one of Tailwind’s max-width theme keys sizes max-w-<name> with the brand’s width', async () => {
  const keys = [...readFileSync(path.join(TAILWIND, 'theme.css'), 'utf8').matchAll(/--max-width-([\w-]+):/g)].map(([, key]) => key)
  assert.deepEqual(keys, ['prose'])
  const brand = withContainers({ prose: { $value: { value: 936, unit: 'px' } }, text: { $value: { value: 640, unit: 'px' } } })
  for (const scope of ['experience', 'root', 'project']) {
    const css = await withTailwind(renderBaseCss(brand, {}, { scope }).replace(/^@import[^;]*;\n?/gm, ''), ['max-w-prose', 'max-w-text'])
    assert.equal(maxWidth(css, 'prose'), '936px', scope)
    assert.equal(maxWidth(css, 'text'), '640px', scope)
  }
})

test('a container named like a Tailwind width keyword or spacing step is refused; any other name is not', async () => {
  const width = (css, utility) => css.match(new RegExp(`\\.${utility.replace('.', '\\\\\\.')} \\{\\s*[\\w-]+: ([^;]+);`))?.[1]
  const refused = ['none', 'screen', 'full', 'svw', 'lvw', 'dvw', 'svh', 'lvh', 'dvh', 'min', 'max', 'fit', 'px', 'auto', '4', '0.5']
  const free = ['lh', '3xs', 'text', 'frame', 'prose']
  const utilities = (name) => ['w', 'min-w', 'max-w'].map((prefix) => `${prefix}-${name}`)
  const plain = await withTailwind('', [...refused, ...free].flatMap(utilities))
  // Tailwind with no brand container: a refused name is one of its own in w-, min-w- or max-w-; a free one reads only --container-*, but
  // max-w-prose, which the brand's key replaces.
  const own = (utility) => width(plain, utility) && !width(plain, utility).includes('--container')
  for (const name of refused) assert.ok(utilities(name).some(own), `${name} is Tailwind's own`)
  for (const name of free.filter((name) => name !== 'prose')) assert.deepEqual(utilities(name).filter(own), [], name)
  const brand = withContainers(Object.fromEntries(['full', 'auto', '4', 'text'].map((name) => [name, { $value: { value: 640, unit: 'px' } }])))
  assert.throws(() => renderBaseCss(brand), /container\.full: it would override Tailwind's own max-w-full/)
  assert.throws(() => renderProjectStylesheet(brand), /container\.auto: it would override Tailwind's own w-auto/)
  assert.deepEqual(brandContainerProblems(brand), [
    "container.4: it would override Tailwind's own spacing step w-4, so a container cannot take that name",
    "container.full: it would override Tailwind's own max-w-full, so a container cannot take that name",
    "container.auto: it would override Tailwind's own w-auto, so a container cannot take that name",
  ])
  assert.deepEqual(brandContainerProblems(withContainers(Object.fromEntries(free.map((name) => [name, { $value: { value: 640, unit: 'px' } }])))), [])
})

test("BB-19 --container-* is Tailwind's scale with the brand's own sizes laid over it: its value wins on a shared name, a new name adds one", () => {
  const empty = JSON.parse(tokens('#123456'))
  const defaults = renderBaseCss(empty)
  assert.match(defaults, /--container-3xs: 16rem;/)
  assert.match(defaults, /--container-7xl: 80rem;/)

  const overridden = {
    ...empty,
    container: { $type: 'dimension', sm: { $value: { value: 22, unit: 'rem' } }, text: { $value: { value: 40, unit: 'rem' } } },
  }
  const css = renderBaseCss(overridden)
  assert.match(css, /--container-sm: 22rem;/)
  assert.doesNotMatch(css, /--container-sm: 24rem;/)
  assert.match(css, /--container-md: 28rem;/)
  assert.match(css, /--container-3xl: 48rem;/)
  assert.match(css, /--container-text: 40rem;/)
})

test('BB-20 each recipe property maps onto a CSS declaration in @utility fui-<name>, after the @theme block', () => {
  const recipes = yamlRecipes(
    designMd(['  chip:', "    backgroundColor: '{colors.primary}'", "    textColor: '{colors.primary}'", "    rounded: '{rounded.md}'", "    typography: '{typography.label}'"].join('\n')),
  )
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(
    css,
    /@utility fui-chip \{\n {2}--tw-sort: container-type;\n {2}background-color: var\(--fui-chip-background-color\);\n {2}color: var\(--fui-chip-text-color\);\n {2}border-radius: var\(--fui-chip-rounded\);\n {2}font-family: var\(--fui-chip-font-family\);\n {2}font-size: var\(--fui-chip-font-size\);\n {2}line-height: var\(--fui-chip-line-height\);\n {2}font-weight: var\(--fui-chip-font-weight\);\n {2}letter-spacing: var\(--fui-chip-letter-spacing\);\n {2}font-feature-settings: var\(--fui-chip-font-feature-settings\);\n {2}font-variation-settings: var\(--fui-chip-font-variation-settings\);\n\}/,
  )
  assert.ok(css.indexOf('@theme inline') < css.indexOf('@utility fui-chip'))
})

test('BB-21 size sets both width and height; height and width stand alone', () => {
  const recipes = yamlRecipes(designMd(["  icon:\n    base: { size: '{spacing.6}' }", "  avatar:\n    base: { height: '{spacing.10}', width: '{spacing.10}' }"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /@utility fui-icon \{\n {2}--tw-sort: container-type;\n {2}width: var\(--fui-icon-size\);\n {2}height: var\(--fui-icon-size\);\n\}/)
  assert.match(css, /@utility fui-avatar \{\n {2}--tw-sort: container-type;\n {2}height: var\(--fui-avatar-height\);\n {2}width: var\(--fui-avatar-width\);\n\}/)
})

test('BB-22 an extra prop like borderColor falls through to its CSS property; a recipe with no valid props emits no utility', () => {
  const recipes = yamlRecipes(designMd(['  outline:', "    borderColor: '{colors.primary}'", '  empty:', "    backgroundColor: '{shadows.big}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /@utility fui-outline \{\n {2}--tw-sort: container-type;\n {2}border-color: var\(--fui-outline-border-color\);\n\}/)
  assert.doesNotMatch(css, /fui-empty/)
})

test('BB-23 a state-key recipe gets its own @utility, separate from the base recipe', () => {
  const recipes = yamlRecipes(designMd(['  button-primary:', "    backgroundColor: '{colors.primary}'", '  button-primary-hover:', "    backgroundColor: '{colors.active}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /@utility fui-button-primary \{\n {2}--tw-sort: container-type;\n {2}background-color: var\(--fui-button-primary-background-color\);\n\}/)
  assert.match(css, /@utility fui-button-primary-hover \{\n {2}--tw-sort: container-type;\n {2}background-color: var\(--fui-button-primary-hover-background-color\);\n\}/)
})

test("BB-24 a recipe key that isn't a clean identifier produces no @utility", () => {
  const recipes = { flat: { 'x:red;}body{color': { opacity: '{opacity.100}' } }, trees: { y: { variants: { a: { 'b;}': { opacity: '{opacity.100}' } } } } } }
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.doesNotMatch(css, /@utility/)
})

test('BB-25 a text style named like a font family slot: one --font-<name>, from the slot', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily', serif: { $value: ['Georgia'] } },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: {
      $type: 'typography',
      serif: {
        $value: {
          fontFamily: ['Inter'],
          fontSize: { value: 1, unit: 'rem' },
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
    },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  const matches = css.match(/--font-serif:/g)
  assert.equal(matches?.length, 1, 'should emit exactly one --font-serif')
  assert.match(css, /--font-serif: var\(--fui-font-serif\);/)
  assert.doesNotMatch(css, /--font-serif: var\(--fui-text-serif-family\);/)
})

test('BB-26 a text style named like a legacy alias (body/display) with no family slot: one --font-<name>, from the text style', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily', sans: { $value: ['Inter'] } },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: {
      $type: 'typography',
      body: {
        $value: {
          fontFamily: ['Courier'],
          fontSize: { value: 0.9, unit: 'rem' },
          fontWeight: 500,
          lineHeight: 1.4,
        },
      },
    },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  const matches = css.match(/--font-body:/g)
  assert.equal(matches?.length, 1, 'should emit exactly one --font-body')
  assert.match(css, /--font-body: var\(--fui-text-body-family\);/)
  assert.doesNotMatch(css, /--font-body: var\(--fui-font-body\);/)
})

test('BB-27 a text style named distinctly: all four lines, including --font-<name> from the text style', () => {
  const brand = {
    color: { $type: 'color' },
    font: {
      family: { $type: 'fontFamily', sans: { $value: ['Inter'] } },
      weight: { $type: 'fontWeight' },
      size: { $type: 'dimension' },
    },
    text: {
      $type: 'typography',
      label: {
        $value: {
          fontFamily: ['Inter'],
          fontSize: { value: 0.75, unit: 'rem' },
          fontWeight: 600,
          lineHeight: 1.2,
        },
      },
    },
    radius: { $type: 'dimension' },
    border: { $type: 'border' },
    shadow: { $type: 'shadow' },
  }
  const css = renderBaseCss(brand)
  assert.match(css, /--text-label: var\(--fui-text-label-size\);/)
  assert.match(css, /--text-label--line-height: var\(--fui-text-label-line-height\);/)
  assert.match(css, /--text-label--font-weight: var\(--fui-text-label-weight\);/)
  assert.match(css, /--text-label--letter-spacing: var\(--fui-text-label-tracking\);/)
  assert.match(css, /--font-label: var\(--fui-text-label-family\);/)
})

test('BB-28 a recipe shadow maps onto box-shadow, a real CSS property', () => {
  const recipes = yamlRecipes(designMd(['  card:', "    shadow: '{shadow.md}'", "    border: '{border.default}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /@utility fui-card \{\n {2}--tw-sort: container-type;\n {2}box-shadow: var\(--fui-card-shadow\);\n {2}border: var\(--fui-card-border\);\n\}/)
})

test('BB-29 font weights map onto --font-weight-*, single-sourced through --fui-font-weight-*', () => {
  const brand = JSON.parse(tokens('#123456'))
  brand.font.weight = { $type: 'fontWeight', regular: { $value: 400 }, bold: { $value: 700 } }
  const css = renderBaseCss(brand)
  assert.match(css, /--fui-font-weight-regular: 400;/)
  assert.match(css, /--fui-font-weight-bold: 700;/)
  assert.match(css, /--font-weight-regular: var\(--fui-font-weight-regular\);/)
  assert.match(css, /--font-weight-bold: var\(--fui-font-weight-bold\);/)
})

test('BB-30 no weights in brand.json emits no --font-weight-* override, so the stock weights stay', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')))
  assert.doesNotMatch(css, /--font-weight-/)
})

test('BB-31 placeholderColor renders as a nested &::placeholder rule, never a placeholder-color property', () => {
  const recipes = yamlRecipes(designMd(['  input-text:', "    backgroundColor: '{colors.primary}'", "    placeholderColor: '{colors.primary}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(
    css,
    /@utility fui-input-text \{\n {2}--tw-sort: container-type;\n {2}background-color: var\(--fui-input-text-background-color\);\n {2}&::placeholder \{\n {4}color: var\(--fui-input-text-placeholder-color\);\n {2}\}\n\}/,
  )
  assert.doesNotMatch(css, /\n {2}placeholder-color: var/)
})

test('BB-32 textTransform and opacity map onto their real CSS properties', () => {
  const recipes = yamlRecipes(designMd(['  input-text:', '    textTransform: uppercase', "    opacity: '{opacity.40}'"].join('\n')))
  const css = renderBaseCss(JSON.parse(tokens('#123456')), recipes)
  assert.match(css, /@utility fui-input-text \{\n {2}--tw-sort: container-type;\n {2}text-transform: var\(--fui-input-text-text-transform\);\n {2}opacity: var\(--fui-input-text-opacity\);\n\}/)
})

test('BB-30 the root scope puts the same vars under :root, the fallback container on body, and no host rule', () => {
  const tokens = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const experience = renderBaseCss(tokens)
  assert.ok(experience.includes('\n:where(.frontic-experience-root, :host) {\n'))
  const experienceContainer = `\n@layer base {\n  :where(.frontic-experience-root, :host) {\n    container-type: inline-size;\n${EXPERIENCE_SIZE.map((d) => `    ${d}\n`).join('')}  }\n}\n`
  const host = '\n:host {\n  display: block;\n}\n\n:host([hidden]) {\n  display: none;\n}\n'
  const rootBase = experience.match(/\n@layer base \{\n {2}:where\(\.frontic-experience-root\) \{\n[^}]*\}\n\}\n/)[0]
  assert.ok(experience.includes(experienceContainer + host + rootBase))
  assert.equal(
    renderBaseCss(tokens, {}, { scope: 'root' }),
    experience.replace(experienceContainer + host + rootBase, '\nbody {\n  container-type: inline-size;\n}\n').replaceAll(':where(.frontic-experience-root, :host) {', ':root {'),
  )
})

const EXPERIENCE_SIZE = ['inline-size: 100%;', 'inline-size: -webkit-fill-available;', 'inline-size: -moz-available;', 'inline-size: stretch;']

// The headers of the blocks the character at `at` sits in, outermost first.
const enclosing = (css, at) => {
  const stack = []
  let start = 0
  for (let i = 0; i < at; i++) {
    if (css[i] === '{') stack.push(css.slice(start, i).trim())
    if (css[i] === '{' || css[i] === '}' || css[i] === ';') start = i + 1
    if (css[i] === '}') stack.pop()
  }
  return stack
}

test('the experience container fills its containing block in the base layer, so a content-sized mount does not collapse and a merchant’s sizing wins', async () => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const css = await withTailwind(renderBaseCss(brand, {}, { scope: 'experience' }).replace(/^@import[^;]*;\n?/gm, ''), ['w-[300px]'])
  const rule = '\n    container-type: inline-size;\n'
  const at = css.indexOf(rule)
  assert.ok(at >= 0)
  assert.equal(css.split(rule).length, 2)
  assert.deepEqual(enclosing(css, at), ['@layer base', ':where(.frontic-experience-root, :host)'])
  assert.deepEqual(
    [...css.slice(at, css.indexOf('}', at)).matchAll(/^\s*([\w-]+: [^;]+;)/gm)].map(([, declaration]) => declaration),
    ['container-type: inline-size;', ...EXPERIENCE_SIZE],
  )
  for (const [i] of [...css.matchAll(/^\s*(?:inline-size|width|container-type):/gm)].map((m) => [m.index])) {
    const blocks = enclosing(css, i)
    if (blocks.at(-1) === ':where(.frontic-experience-root, :host)') assert.deepEqual(blocks, ['@layer base', ':where(.frontic-experience-root, :host)'], 'no unlayered size')
  }
  const utility = css.indexOf('width: 300px;')
  assert.deepEqual(enclosing(css, utility), ['@layer utilities', '.w-\\[300px\\]'])
  assert.match(css, /@layer theme, base, components, utilities;/, 'utilities layered after base')
  assert.match(css, /\n:where\(\.frontic-experience-root, :host\) \{\n {2}box-sizing: border-box;\n/)
  for (const scope of ['root', 'project']) assert.ok(renderBaseCss(brand, {}, { scope }).includes('\nbody {\n  container-type: inline-size;\n}\n'), scope)
})

test('BB-31 an unknown scope throws, naming it', () => {
  assert.throws(() => renderBaseCss({}, {}, { scope: 'page' }), /unknown brand CSS scope: page/)
})

test('BB-32 buildBrandCss writes the scope it is given', async () => {
  const dir = content()
  assert.equal(await buildBrandCss(dir, { scope: 'root' }), true)
  assert.match(readFileSync(path.join(dir, 'styles', 'base.css'), 'utf8'), /\n:root \{\n/)
})

test('BB-33 the project scope has tokens on :root and recipes, and resets no Tailwind namespace', () => {
  const tokens = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const recipes = yamlRecipes(designMd("  card:\n    rounded: '{rounded.base}'"))
  const root = renderBaseCss(tokens, recipes, { scope: 'root' })
  const project = renderBaseCss(tokens, recipes, { scope: 'project' })
  assert.match(project, /\n:root \{\n/)
  assert.match(project, /--fui-card-rounded: var\(--fui-radius\);/)
  assert.match(project, /@utility fui-card \{/)
  assert.doesNotMatch(project, /: initial;/)
  const resets = root.split('\n').filter((line) => /^ {2}--[a-z-]+-\*: initial;$/.test(line))
  assert.equal(resets.length, 6)
  assert.equal(project, root.replace(`${resets.join('\n')}\n\n`, ''))
})

test('BB-34 the project stylesheet is its header line over the project-scope CSS', () => {
  const tokens = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const recipes = yamlRecipes(designMd("  card:\n    rounded: '{rounded.base}'"))
  const css = renderProjectStylesheet(tokens, recipes)
  assert.ok(css.startsWith(`${PROJECT_STYLESHEET_HEADER}\n`))
  assert.equal(css, `${PROJECT_STYLESHEET_HEADER}\n${renderBaseCss(tokens, recipes, { scope: 'project' })}`)
})

test('BB-35 RECIPE_KEY is the rule the recipe reader applies to names and props', () => {
  const recipes = yamlRecipes(designMd("  card:\n    opacity: '{opacity.100}'\n  3d:\n    opacity: '{opacity.100}'"))
  const css = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), recipes)
  assert.ok(RECIPE_KEY.test('card') && css.includes('fui-card'))
  assert.ok(!RECIPE_KEY.test('3d') && !css.includes('fui-3d'))
})

const TREE = designMd(
  [
    '  focus-ring:',
    "    outlineColor: '{colors.ring/50}'",
    '  control:',
    "    border: '{border.default}'",
    "    shadow: '{shadow.xs}'",
    "    placeholderColor: '{colors.muted-foreground}'",
    '  action:',
    "    border: '{border.default}'",
    '    borderColor: transparent',
    "    rounded: '{rounded.md}'",
    "    typography: '{typography.ui}'",
    '  button:',
    '    base:',
    '      extends: action',
    '    variants:',
    '      variant:',
    '        brand-primary:',
    "          backgroundColor: '{colors.primary}'",
    "          with: { size: { lg: { paddingX: '{spacing.px}' } } }",
    '      size:',
    "        xs: { height: '{spacing.6}', paddingX: '{spacing.2}', gap: '{spacing.1}', typography: '{typography.caption}', icon: { size: '{spacing.3}' } }",
    "        lg: { height: '{spacing.10}', paddingX: '{spacing.2.5}' }",
    '    defaults: { variant: brand-primary, size: lg }',
    '  input:',
    '    base:',
    "      extends: ['control']",
    "      height: '{spacing.9}'",
  ].join('\n'),
)
const utility = (css, name) => {
  const start = css.indexOf(`@utility ${name} {`)
  assert.ok(start >= 0, name)
  return css.slice(start, css.indexOf('\n}', start) + 2)
}

test('BB-40 a component tree and a flat recipe split apart', () => {
  const { flat, trees } = yamlRecipes(TREE)
  assert.deepEqual(Object.keys(flat), ['focus-ring', 'control', 'action'])
  assert.deepEqual(Object.keys(trees), ['button', 'input'])
})

test('BB-41 a tree renders a utility per class it makes, flat recipes one each, all fui-; a pair is a rule in each of its values, no class', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')), yamlRecipes(TREE))
  for (const name of ['fui-button', 'fui-button-brand-primary', 'fui-button-xs', 'fui-button-lg', 'fui-input', 'fui-control', 'fui-focus-ring', 'fui-action']) utility(css, name)
  assert.doesNotMatch(css, /@utility fui-button-brand-primary-lg/)
  assert.match(utility(css, 'fui-button-lg'), /\n {2}&:where\(\.fui-button-brand-primary\) \{\n {4}padding-inline: var\(--fui-button-brand-primary-lg-padding-x\);\n {2}\}/)
  assert.match(utility(css, 'fui-button-brand-primary'), /\n {2}&:where\(\.fui-button-lg\) \{\n {4}padding-inline: var\(--fui-button-brand-primary-lg-padding-x\);\n {2}\}/)
  assert.doesNotMatch(utility(css, 'fui-button-xs'), /&:where\(\.fui/)
  assert.doesNotMatch(css, /recipe(?=-)|--fx(?=-)/)
  assert.match(css, /--fui-primary: #123456;/)
  assert.match(css, /--fui-spacing: 0\.25rem;/)
  assert.match(css, /--fui-button-rounded: var\(--fui-radius-md\);/)
  assert.match(css, /--fui-text-ui-size: /)
})

test('BB-42 a size sets its layout through the spacing base, its text style and the icon part', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')), yamlRecipes(TREE))
  const xs = utility(css, 'fui-button-xs')
  for (const property of ['height', 'padding-inline', 'gap', 'font-family', 'font-size', 'line-height', 'font-weight', 'letter-spacing', 'font-feature-settings', 'font-variation-settings'])
    assert.match(xs, new RegExp(`\\n {2}${property}: var\\(--fui-button-xs-`), property)
  assert.match(xs, /\n {2}& :where\(\[data-icon\]\) \{\n {4}width: var\(--fui-button-xs-icon-size\);\n {4}height: var\(--fui-button-xs-icon-size\);\n {2}\}/)
  assert.match(css, /--fui-button-xs-height: calc\(var\(--fui-spacing\) \* 6\);/)
  assert.match(css, /--fui-button-lg-padding-x: calc\(var\(--fui-spacing\) \* 2\.5\);/)
  assert.match(css, /--fui-button-brand-primary-lg-padding-x: 1px;/)
})

test('BB-42b a base pads one side on the spacing base, as a select clears its chevron', () => {
  const css = renderBaseCss(
    JSON.parse(tokens('#123456')),
    yamlRecipes(
      designMd(
        ['  select:', '    base:', "      paddingStart: '{spacing.2.5}'", "      paddingEnd: '{spacing.8}'", "      paddingTop: '{spacing.1}'", "      paddingBottom: '{spacing.px}'"].join('\n'),
      ),
    ),
  )
  const select = utility(css, 'fui-select')
  for (const property of ['padding-inline-start', 'padding-inline-end', 'padding-top', 'padding-bottom']) assert.match(select, new RegExp(`\\n {2}${property}: var\\(--fui-select-`), property)
  assert.match(css, /--fui-select-padding-end: calc\(var\(--fui-spacing\) \* 8\);/)
  assert.match(css, /--fui-select-padding-bottom: 1px;/)
})

test('BB-42c a base borders the start or end side, so a right-to-left page mirrors it', () => {
  const css = renderBaseCss(
    JSON.parse(tokens('#123456')),
    yamlRecipes(designMd(['  rail:', '    base:', "      borderStart: '{border.default}'", '  panel:', '    base:', "      borderEnd: '{border.default}'"].join('\n'))),
  )
  assert.match(utility(css, 'fui-rail'), /\n {2}border-inline-start: var\(--fui-rail-border-start\);/)
  assert.match(utility(css, 'fui-panel'), /\n {2}border-inline-end: var\(--fui-panel-border-end\);/)
  assert.doesNotMatch(css, /border-left|border-right/)
})

test('BB-43 a base inlines what it uses: fui-input carries control’s look and its own height', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')), yamlRecipes(TREE))
  const input = utility(css, 'fui-input')
  assert.match(input, /\n {2}border: var\(--fui-input-border\);/)
  assert.match(input, /\n {2}box-shadow: var\(--fui-input-shadow\);/)
  assert.match(input, /\n {2}height: var\(--fui-input-height\);/)
  assert.match(input, /\n {2}&::placeholder \{\n {4}color: var\(--fui-input-placeholder-color\);/)
  assert.match(utility(css, 'fui-button'), /\n {2}border-color: var\(--fui-button-border-color\);/)
})

test('BB-44 the base sorts before the values, a pair’s rule after both of its values, all before any utility', async () => {
  const base = renderBaseCss(JSON.parse(tokens('#123456')), yamlRecipes(TREE)).replace(/^@import[^;]*;\n?/gm, '')
  assert.match(utility(base, 'fui-button'), /^@utility fui-button \{\n {2}--tw-sort: container-type;/)
  assert.match(utility(base, 'fui-control'), /^@utility fui-control \{\n {2}--tw-sort: container-type;/)
  assert.match(utility(base, 'fui-button-xs'), /^@utility fui-button-xs \{\n {2}--tw-sort: pointer-events;/)
  assert.match(utility(base, 'fui-button-brand-primary'), /^@utility fui-button-brand-primary \{\n {2}--tw-sort: pointer-events;/)
  assert.doesNotMatch(base, /--tw-sort: visibility/)
  const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['px-2', 'fui-button-lg', 'fui-button-brand-primary', 'fui-button', 'fui-button-brand-primary-lg'])
  const at = (text) => {
    const index = css.indexOf(text)
    assert.ok(index >= 0, text)
    return index
  }
  const values = [at('.fui-button-brand-primary {'), at('.fui-button-lg {')]
  assert.ok(at('.fui-button {') < Math.min(...values), 'base before values')
  assert.ok(Math.max(...values) < Math.max(at(':where(.fui-button-brand-primary)'), at(':where(.fui-button-lg)')), 'a copy of the pair’s rule after both values')
  assert.ok(Math.max(at(':where(.fui-button-brand-primary)'), at(':where(.fui-button-lg)')) < at('.px-2 {'), 'every utility after')
  assert.doesNotMatch(css, /\.fui-button-brand-primary-lg/)
})

test('BB-45 layout renders on a value of any axis; a pair outranks two axes setting one layout property', () => {
  const css = renderBaseCss(
    JSON.parse(tokens('#123456')),
    yamlRecipes(
      designMd(
        "  tag:\n    variants:\n      tone:\n        a: { paddingX: '{spacing.2}', textColor: '{colors.primary}', with: { side: { left: { paddingX: '{spacing.6}' } } } }\n      side:\n        left: { paddingX: '{spacing.4}' }",
      ),
    ),
  )
  assert.match(css, /--fui-tag-a-padding-x: calc\(var\(--fui-spacing\) \* 2\);/)
  assert.match(css, /--fui-tag-a-text-color: var\(--fui-primary\);/)
  assert.match(css, /--fui-tag-a-left-padding-x: calc\(var\(--fui-spacing\) \* 6\);/)
  for (const name of ['fui-tag-a', 'fui-tag-left']) assert.match(utility(css, name), /^@utility [\w-]+ \{\n {2}--tw-sort: pointer-events;[\s\S]*\n {2}padding-inline: var\(--fui-tag-/)
  assert.match(
    utility(css, 'fui-tag-left'),
    /\n {2}padding-inline: var\(--fui-tag-left-padding-x\);\n {2}&:where\(\.fui-tag-a\) \{\n {4}padding-inline: var\(--fui-tag-a-left-padding-x\);\n {2}\}\n\}$/,
  )
  assert.match(
    utility(css, 'fui-tag-a'),
    /\n {2}padding-inline: var\(--fui-tag-a-padding-x\);\n {2}color: var\(--fui-tag-a-text-color\);\n {2}&:where\(\.fui-tag-left\) \{\n {4}padding-inline: var\(--fui-tag-a-left-padding-x\);\n {2}\}\n\}$/,
  )
})

test('BB-45c a pair’s states, parts and step render inside its rule, and Tailwind keeps them under the value', async () => {
  const base = renderBaseCss(
    JSON.parse(tokens('#123456')),
    yamlRecipes(
      designMd(
        [
          '  cell:',
          '    variants:',
          '      day:',
          "        today: { textColor: '{colors.primary}' }",
          '      position:',
          '        edge:',
          "          with: { day: { today: { paddingX: '{spacing.1}', hover: { backgroundColor: '{colors.accent}' }, focus: { outlineColor: '{colors.ring}' }, icon: { size: '{spacing.3}' }, '@md': { paddingX: '{spacing.2}' } } } }",
        ].join('\n'),
      ),
    ),
  ).replace(/^@import[^;]*;\n?/gm, '')
  const rule = utility(base, 'fui-cell-today')
  assert.match(
    rule,
    new RegExp(
      [
        '\\n {2}&:where\\(\\.fui-cell-edge\\) \\{',
        '\\n {4}padding-inline: var\\(--fui-cell-today-edge-padding-x\\);',
        '\\n {4}&:hover \\{\\n {6}background-color: var\\(--fui-cell-today-edge-hover-background-color\\);\\n {4}\\}',
        '\\n {4}&:focus-visible \\{\\n {6}outline-color: var\\(--fui-cell-today-edge-focus-outline-color\\);\\n {4}\\}',
        '\\n {4}& :where\\(\\[data-icon\\]\\) \\{\\n {6}width: var\\(--fui-cell-today-edge-icon-size\\);\\n {6}height: var\\(--fui-cell-today-edge-icon-size\\);\\n {4}\\}',
        '\\n {4}@container \\(width >= 28rem\\) \\{\\n {6}padding-inline: var\\(--fui-cell-today-edge-md-padding-x\\);\\n {4}\\}',
        '\\n {2}\\}\\n\\}$',
      ].join(''),
    ),
  )
  assert.match(utility(base, 'fui-cell-edge'), /\n {2}&:where\(\.fui-cell-today\) \{\n {4}padding-inline: var\(--fui-cell-today-edge-padding-x\);\n {4}&:hover \{/)
  const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['fui-cell-today', 'fui-cell-edge', 'hover:bg-red-500'])
  const utilities = css.slice(0, css.indexOf('.hover\\:bg-red-500'))
  // A value with nothing of its own flattens to `.fui-cell-edge:where(.fui-cell-today)`; one with declarations keeps the rule nested.
  for (const value of ['today', 'edge']) {
    const start = utilities.search(new RegExp(`^\\.fui-cell-${value}`, 'm'))
    const rule = utilities.slice(start, utilities.indexOf('\n}', start))
    assert.ok(rule.includes(':where(.fui-cell-') && rule.includes('--fui-cell-today-edge-hover-background-color') && rule.includes('--fui-cell-today-edge-md-padding-x'), rule)
  }
})

test('BB-47 a tree’s base utility resets every part variable its values override to the part’s own base declaration', () => {
  const card = (bare) =>
    renderBaseCss(
      JSON.parse(tokens('#123456')),
      yamlRecipes(
        designMd(
          [
            '  card:',
            "    base: { gap: '{spacing.4}' }",
            '    variants:',
            '      surface:',
            '        raised: {}',
            `        bare: ${bare}`,
            '    defaults: { surface: raised }',
            '  card-header:',
            "    base: { paddingX: '{spacing.8}', gap: '{spacing.2}' }",
            '    variants:',
            '      size:',
            "        sm: { paddingX: '{spacing.4}' }",
          ].join('\n'),
        ),
      ),
    )
  const css = card("{ parts: { card-header: { paddingX: '{spacing.0}' } } }")
  assert.match(
    utility(css, 'fui-card'),
    /^@utility fui-card \{\n {2}--tw-sort: container-type;\n {2}gap: var\(--fui-card-gap\);\n {2}--fui-card-header-padding-x: calc\(var\(--fui-spacing\) \* 8\);\n\}$/,
  )
  assert.match(utility(css, 'fui-card-bare'), /^@utility fui-card-bare \{\n {2}--tw-sort: pointer-events;\n {2}--fui-card-header-padding-x: var\(--fui-card-bare-card-header-padding-x\);\n\}$/)
  assert.doesNotMatch(css, /--fui-card-card-header-padding-x/)
  assert.match(utility(css, 'fui-card-header'), /padding-inline: var\(--fui-card-header-padding-x\);/)
  const plain = card('{ shadow: none }')
  assert.doesNotMatch(utility(plain, 'fui-card'), /--fui-card-header-/)
})

test('BB-45b a base overriding a family it uses renders the base’s declaration once, in the one utility', () => {
  const css = renderBaseCss(
    JSON.parse(tokens('#123456')),
    yamlRecipes(designMd("  surface:\n    backgroundColor: transparent\n    rounded: '{rounded.md}'\n  tile:\n    base:\n      extends: 'surface'\n      backgroundColor: '{colors.background}'")),
  )
  const tile = utility(css, 'fui-tile')
  assert.match(css, /--fui-tile-background-color: var\(--fui-background\);/)
  assert.doesNotMatch(css, /--fui-tile-background-color: transparent;/)
  assert.equal(tile.match(/\n {2}background-color:/g)?.length, 1)
  assert.match(tile, /\n {2}border-radius: var\(--fui-tile-rounded\);/)
})

test('BB-46 a recipe set of the pre-tree shape throws, naming the recipe', () => {
  const brand = JSON.parse(tokens('#123456'))
  assert.throws(() => renderBaseCss(brand, { control: { backgroundColor: '{colors.primary}' } }), /renderBaseCss takes \{ flat, trees \}.*"control"/)
  assert.throws(() => renderBaseCss(brand, { flat: { chip: 'x' } }), /recipe chip: neither a flat recipe nor a component tree/)
  for (const [prop, value] of [
    ['extends', "'control'"],
    ['with', '{ size: { sm: {} } }'],
    ['parts', "{ 'chip-icon': { size: '{spacing.4}' } }"],
    ['ringColor', "'{colors.destructive/20}'"],
  ])
    assert.throws(() => renderBaseCss(brand, yamlRecipes(designMd(`  chip:\n    ${prop}: ${value}`))), new RegExp(`recipe chip: ${prop} belongs to a component tree’s value`))
  assert.match(renderBaseCss(brand, yamlRecipes(designMd("  chip:\n    height: '{spacing.9}'\n    icon: { size: '{spacing.4}' }"))), /--fui-chip-height: calc\(var\(--fui-spacing\) \* 9\);/)
  // A tree of the pre-with shape throws too, so a project's next build names the migration instead of dropping the pairs.
  assert.throws(
    () => renderBaseCss(brand, yamlRecipes(designMd("  chip:\n    variants:\n      tone: { a: {} }\n      size: { s: {} }\n    compounds: [{ when: { tone: a, size: s }, gap: '{spacing.1}' }]"))),
    /recipe chip: compounds moved under their first value as with/,
  )
})

test('BB-47 a tree’s own value colours the focus ring', () => {
  const css = renderBaseCss(JSON.parse(tokens('#123456')), { flat: { chip: { textColor: '{colors.primary}' } }, trees: { tag: { base: { ringColor: '{colors.primary}' } } } })
  assert.match(css, /--fui-ring-color: var\(--fui-tag-ring-color\);/)
})

test('BB-48 every scope names reka’s states, sides and motions as variants that read its attributes', async () => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  for (const scope of ['experience', 'root', 'project']) {
    const base = renderBaseCss(brand, {}, { scope }).replace(/^@import[^;]*;\n?/gm, '')
    const css = (await compile(`${base}\n@tailwind utilities;\n`)).build([
      'data-open:flex',
      'data-closed:flex',
      'data-state-delayed-open:flex',
      'data-state-hidden:flex',
      'data-side-bottom:flex',
      'data-side-left:flex',
      'data-motion-from:flex',
      'data-motion-to-end:flex',
    ])
    for (const selector of [
      '.data-open\\:flex:where([data-state="open"])',
      '.data-open\\:flex:where([data-open]:not([data-open="false"]))',
      '.data-closed\\:flex:where([data-state="closed"])',
      '.data-state-delayed-open\\:flex:where([data-state="delayed-open"])',
      '.data-state-hidden\\:flex:where([data-state="hidden"])',
      '.data-motion-from\\:flex:where([data-motion^="from-"])',
      '.data-motion-to-end\\:flex:where([data-motion="to-end"])',
      '.data-side-bottom\\:flex:where([data-side="bottom"])',
      '.data-side-left\\:flex:where([data-side="left"])',
    ])
      assert.ok(css.includes(`${selector} {`), `${scope}: ${selector}`)
    assert.ok(!css.includes('[data-side-bottom]'), scope)
  }
})

test('BB-49 every scope slides an indeterminate progress bar on its own keyframes', async () => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  for (const scope of ['experience', 'root', 'project']) {
    const base = renderBaseCss(brand, {}, { scope }).replace(/^@import[^;]*;\n?/gm, '')
    const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['data-state-indeterminate:animate-progress-indeterminate'])
    assert.ok(css.includes('.data-state-indeterminate\\:animate-progress-indeterminate:where([data-state="indeterminate"]) {'), scope)
    assert.match(css, /animation: progress-indeterminate 1.5s ease-in-out infinite/, scope)
    assert.match(css, /@keyframes progress-indeterminate \{/, scope)
  }
})

test('BR-EMPTY a tree whose base or value is {} still makes its class: an @utility that sets nothing', () => {
  const css = renderBaseCss(
    JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')),
    yamlRecipes('---\ncomponents:\n  rail:\n    base: {}\n    variants:\n      mode:\n        default: {}\n    defaults: { mode: default }\n---\n'),
  )
  assert.match(css, /@utility fui-rail \{\n {2}--tw-sort: container-type;\n {2}--fui_empty: initial;\n\}/)
  assert.match(css, /@utility fui-rail-default \{\n {2}--tw-sort: pointer-events;\n {2}--fui_empty: initial;\n\}/)
})

test('BR-MAXW a max width renders as max-width, takes a container size and steps at the md container width', async () => {
  const designMd =
    "---\ncomponents:\n  sheet:\n    variants:\n      size:\n        md: { maxWidth: '{container.xs}', '@md': { maxWidth: '{container.md}' } }\n        sm: { maxWidth: '{spacing.80}' }\n---\n"
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const css = renderBaseCss(brand, yamlRecipes(designMd))
  assert.match(css, /--fui-sheet-md-max-width: var\(--container-xs\);/)
  assert.match(css, /--fui-sheet-md-md-max-width: var\(--container-md\);/)
  assert.match(css, /--fui-sheet-sm-max-width: calc\(var\(--fui-spacing\) \* 80\);/)
  assert.match(
    css,
    /@utility fui-sheet-md \{\n {2}--tw-sort: pointer-events;\n {2}max-width: var\(--fui-sheet-md-max-width\);\n {2}@container \(width >= 28rem\) \{\n {4}max-width: var\(--fui-sheet-md-md-max-width\);\n {2}\}\n\}/,
  )
  const built = (await compile(`${css.replace(/^@import[^;]*;\n?/gm, '')}\n@tailwind utilities;\n`)).build(['fui-sheet-md'])
  assert.match(built, /--container-xs: 20rem;/)
  assert.match(built, /--container-md: 28rem;/)
})

test('BR-CONT a brand’s container sizes are Tailwind’s plus its own, and a recipe may name any of them', () => {
  const scale = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl']
  assert.deepEqual(containerNames({ container: { $type: 'dimension', narrow: { $value: { value: 20, unit: 'rem' } } } }), [...scale, 'narrow'])
  assert.deepEqual(containerNames({}), scale)

  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  brand.container = { $type: 'dimension', text: { $value: { value: 40, unit: 'rem' } } }
  const recipes = yamlRecipes("---\ncomponents:\n  sheet:\n    maxWidth: '{container.3xl}'\n---\n")
  assert.deepEqual(recipeTokenProblems(recipes, brand), [])
  assert.match(renderBaseCss(brand, recipes), /--container-3xl: 48rem;/)
})

test('BR-CONT2 defaultContainers hands out a copy of Tailwind’s container scale', () => {
  const scale = defaultContainers()
  assert.equal(Object.keys(scale).length, 13)
  assert.equal(scale['3xl'], '48rem')
  scale['3xl'] = '1px'
  assert.equal(defaultContainers()['3xl'], '48rem')
})

test('BR-PLATFORM the breakpoint fallback for a storefront platform the derive cannot read its own from', () => {
  const bootstrap = { sm: '576px', md: '768px', lg: '992px', xl: '1200px', '2xl': '1400px' }
  assert.deepEqual(PLATFORM_BREAKPOINTS, { 'shopware-6': bootstrap, shopware: bootstrap })
  assert.ok(Object.isFrozen(PLATFORM_BREAKPOINTS))
  assert.ok(Object.isFrozen(PLATFORM_BREAKPOINTS.shopware))
})

test('BR-EMPTY2 Tailwind knows an empty class, so the class lint takes it', async () => {
  const base = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), yamlRecipes('---\ncomponents:\n  rail:\n    base: {}\n---\n')).replace(/^@import[^;]*;\n?/gm, '')
  const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['fui-rail'])
  assert.match(css, /\.fui-rail \{\n {2}--fui_empty: initial;\n\}/)
})

test('BR-STEP a stepped layout value renders its own size, and the step’s inside the md container width', async () => {
  const designMd = "---\ncomponents:\n  swatch:\n    variants:\n      size:\n        sm: { size: '{spacing.12}', '@md': { size: '{spacing.9}' } }\n---\n"
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  const css = renderBaseCss(brand, yamlRecipes(designMd))
  assert.match(css, /--fui-swatch-sm-size: calc\(var\(--fui-spacing\) \* 12\);/)
  assert.match(css, /--fui-swatch-sm-md-size: calc\(var\(--fui-spacing\) \* 9\);/)
  assert.match(
    css,
    /@utility fui-swatch-sm \{\n {2}--tw-sort: pointer-events;\n {2}width: var\(--fui-swatch-sm-size\);\n {2}height: var\(--fui-swatch-sm-size\);\n {2}@container \(width >= 28rem\) \{\n {4}width: var\(--fui-swatch-sm-md-size\);\n {4}height: var\(--fui-swatch-sm-md-size\);\n {2}\}\n\}/,
  )
  const own = renderBaseCss({ ...brand, container: { $type: 'dimension', md: { $value: { value: 30, unit: 'rem' } } } }, yamlRecipes(designMd))
  assert.match(own, /@container \(width >= 30rem\) \{\n {4}width: var\(--fui-swatch-sm-md-size\);/)
})

test('BR-RING the rendered base.css holds the focus ring’s colour at rest, at zero width, on every element that names the ring', () => {
  const css = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), {
    flat: { 'focus-ring': { outlineWidth: '3px', outlineStyle: 'solid', outlineColor: '{colors.ring/50}' } },
  })
  assert.ok(css.includes("@layer base {\n  :where([class*='fui-focus-ring']) {\n    outline: 0 solid var(--fui-ring-color, var(--fui-focus-ring-outline-color));\n  }\n}"))
  assert.ok(css.includes('  outline-color: var(--fui-ring-color, var(--fui-focus-ring-outline-color));'))
  assert.ok(!renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), { flat: { control: { opacity: '{opacity.100}' } } }).includes('fui-focus-ring'))
})

test('BR-RING2 a ring drawn without an outline colour gets no rest rule and leaves no variable unset', () => {
  const css = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), { flat: { 'focus-ring': { shadow: '{shadow.xs}', borderColor: '{colors.ring}' } } })
  assert.ok(css.includes('@utility fui-focus-ring'))
  assert.ok(!css.includes(':where([class*='))
  const declared = new Set([...css.matchAll(/^\s*(--fui-[\w-]+):/gm)].map((m) => m[1]))
  const read = new Set([...css.matchAll(/var\((--fui-focus-ring-[\w-]+)/g)].map((m) => m[1]))
  assert.deepEqual(
    [...read].filter((name) => !declared.has(name)),
    [],
  )
})

const family = (sans, heading = sans) => ({ font: { family: { $type: 'fontFamily', sans, heading, mono: { $value: ['ui-monospace', 'monospace'] } } } })
const named = (pkg) => ({ $value: ['Archivo Variable', 'Archivo', 'sans-serif'], $extensions: { 'com.frontic.brand': { fontsource: pkg } } })

test('BB-49 a family that names its fontsource package renders the same CSS as one that does not', () => {
  const plain = { $value: ['Archivo Variable', 'Archivo', 'sans-serif'] }
  assert.equal(renderBaseCss(family(named('@fontsource-variable/archivo'))), renderBaseCss(family(plain)))
})

test('BB-50 fontPackages lists each fontsource package a family names once, and nothing else', () => {
  assert.deepEqual(fontPackages(family(named('@fontsource-variable/archivo'))), { '@fontsource-variable/archivo': '*' })
  assert.deepEqual(fontPackages(family(named('@fontsource/archivo'), named('@fontsource-variable/inter'))), { '@fontsource-variable/inter': '*', '@fontsource/archivo': '*' })
  assert.deepEqual(fontPackages(family({ $value: ['system-ui'] })), {})
  for (const pkg of ['left-pad', '@fontsource-variable/archivo@5.3.0', '@evil/archivo', 42]) assert.deepEqual(fontPackages(family(named(pkg))), {}, String(pkg))
  for (const brand of [null, undefined, 'x', {}, { font: {} }]) assert.deepEqual(fontPackages(brand), {})
})

test('BB-56 the project stylesheet imports each font package the brand names and the project has installed, right under its header', () => {
  const tokens = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  tokens.font.family.heading = named('@fontsource-variable/archivo')
  const base = renderProjectStylesheet(tokens)
  // No option: the stylesheet as it was, which the stack's own renderer relies on.
  assert.equal(base, `${PROJECT_STYLESHEET_HEADER}\n${renderBaseCss(tokens, {}, { scope: 'project' })}`)
  const both = renderProjectStylesheet(tokens, {}, { fonts: ['@fontsource-variable/inter', '@fontsource-variable/archivo', 'left-pad'] })
  assert.deepEqual(both.split('\n').slice(0, 3), [PROJECT_STYLESHEET_HEADER, "@import '@fontsource-variable/archivo';", "@import '@fontsource-variable/inter';"])
  assert.equal(both, base.replace('\n', "\n@import '@fontsource-variable/archivo';\n@import '@fontsource-variable/inter';\n"))
  // A package the project lacks is not imported: the import would not resolve.
  assert.equal(renderProjectStylesheet(tokens, {}, { fonts: ['@fontsource-variable/inter'] }).split('\n')[1], "@import '@fontsource-variable/inter';")
  assert.equal(renderProjectStylesheet(tokens, {}, { fonts: [] }), base)
})

const srgb = (hex, alpha) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return alpha === undefined ? { colorSpace: 'srgb', components: [r, g, b], hex } : { colorSpace: 'srgb', components: [r, g, b], hex, alpha }
}
const colours = (groups) => ({
  color: {
    $type: 'color',
    ...Object.fromEntries(Object.entries(groups).map(([group, names]) => [group, Object.fromEntries(Object.entries(names).map(([name, value]) => [name, { $value: value }]))])),
  },
})

test('BB-51 every shipped preset has no pair below threshold', () => {
  for (const preset of ['default', 'basecamp-style']) {
    assert.deepEqual(brandContrastProblems(JSON.parse(readFileSync(stylePresetPath(preset), 'utf8'))), [], preset)
  }
})

test('BB-52 a text pair below 4.5:1 is reported with its ratio and need, sorted by group then name', () => {
  const problems = brandContrastProblems(
    colours({
      status: { info: srgb('#ffffff'), 'info-foreground': srgb('#000000') },
      action: { primary: srgb('#ffffff'), 'primary-foreground': srgb('#f0f0f0'), secondary: srgb('#767676'), 'secondary-foreground': srgb('#ffffff') },
      surface: { background: srgb('#ffffff'), foreground: srgb('#777777') },
    }),
  )
  assert.deepEqual(problems, [
    { pair: 'action.primary / action.primary-foreground', ratio: 1.14, needs: 4.5 },
    { pair: 'surface.background / surface.foreground', ratio: 4.48, needs: 4.5 },
  ])
})

test('BB-56 a `<name>-hover` tone is measured under `<name>-foreground`, never as a text base of its own', () => {
  const problems = brandContrastProblems(
    colours({
      action: { primary: srgb('#7008e7'), 'primary-foreground': srgb('#f5f3ff'), 'primary-hover': srgb('#d4c2f5') },
      commerce: { buy: srgb('#7008e7'), 'buy-foreground': srgb('#f5f3ff'), 'buy-hover': srgb('#5e07c2') },
    }),
  )
  assert.deepEqual(problems, [{ pair: 'action.primary-hover / action.primary-foreground', ratio: 1.49, needs: 4.5 }])
})

test('BB-57 `surface.foreground-hover` is measured under `surface.background`, the text a neutral fill carries', () => {
  const problems = brandContrastProblems(colours({ surface: { background: srgb('#ffffff'), foreground: srgb('#09090b'), 'foreground-hover': srgb('#d4d4d8') } }))
  assert.deepEqual(problems, [{ pair: 'surface.foreground-hover / surface.background', ratio: 1.48, needs: 4.5 }])
})

test('BB-58 brand text pairs take the text threshold; the ring stays at 3', () => {
  const tokens = colours({ action: { primary: srgb('#767676'), 'primary-foreground': srgb('#ffffff') }, surface: { background: srgb('#ffffff') }, edge: { ring: srgb('#8a8a8a') } })
  assert.deepEqual(brandContrastProblems(tokens), [])
  assert.deepEqual(brandContrastProblems(tokens, { text: 7 }), [{ pair: 'action.primary / action.primary-foreground', ratio: 4.54, needs: 7 }])
})

test('BB-53 the ring needs 3:1 against the surface background; border and input are not checked', () => {
  const problems = brandContrastProblems(colours({ surface: { background: srgb('#ffffff') }, edge: { border: srgb('#cccccc'), input: srgb('#cccccc'), ring: srgb('#9f9fa9') } }))
  assert.deepEqual(problems, [{ pair: 'edge.ring / surface.background', ratio: 2.62, needs: 3 }])
  assert.deepEqual(brandContrastProblems(colours({ surface: { background: srgb('#ffffff') }, edge: { border: srgb('#cccccc'), input: srgb('#cccccc'), ring: srgb('#8e8e98') } })), [])
})

test('BB-54 a translucent token is composited over the other colour of its pair before measuring', () => {
  const opaque = brandContrastProblems(colours({ action: { primary: srgb('#ffffff'), 'primary-foreground': srgb('#999999') } }))
  const faded = brandContrastProblems(colours({ action: { primary: srgb('#ffffff'), 'primary-foreground': srgb('#000000', 0.4) } }))
  assert.deepEqual(opaque, [{ pair: 'action.primary / action.primary-foreground', ratio: 2.85, needs: 4.5 }])
  assert.deepEqual(faded, opaque)
  assert.deepEqual(brandContrastProblems(colours({ surface: { background: srgb('#ffffff') }, edge: { ring: srgb('#000000', 0.1) } })), [
    { pair: 'edge.ring / surface.background', ratio: 1.25, needs: 3 },
  ])
})

test('BB-55 a pair with a missing or non-colour token is skipped, not reported; an aliased one is measured as the colour it names', () => {
  assert.deepEqual(brandContrastProblems(colours({ action: { primary: srgb('#ffffff') }, edge: { ring: srgb('#ffffff') } })), [])
  assert.deepEqual(
    brandContrastProblems(colours({ action: { primary: srgb('#ffffff'), 'primary-foreground': srgb('#000000') }, surface: { background: srgb('#ffffff'), foreground: { value: 1, unit: 'px' } } })),
    [],
  )
  assert.deepEqual(
    brandContrastProblems(
      colours({ action: { primary: srgb('#ffffff'), 'primary-foreground': '{color.surface.background}' }, surface: { background: srgb('#ffffff'), foreground: { value: 1, unit: 'px' } } }),
    ),
    [{ pair: 'action.primary / action.primary-foreground', ratio: 1, needs: 4.5 }],
  )
  for (const brand of [null, undefined, 'x', {}, { color: {} }, { color: { action: 'x' } }]) assert.deepEqual(brandContrastProblems(brand), [])
})

test('an opacity token is an integer from 0 to 100', () => {
  const brand = JSON.parse(tokens('#123456'))
  assert.deepEqual(brandOpacityProblems({ ...brand, opacity: { faint: { $value: 120 } } }), ['opacity.faint: an opacity is an integer from 0 to 100'])
  assert.deepEqual(brandOpacityProblems({ ...brand, opacity: { faint: { $value: 0.5 } } }), ['opacity.faint: an opacity is an integer from 0 to 100'])
  assert.deepEqual(brandOpacityProblems({ ...brand, opacity: { faint: { $value: 50 } } }), [])
  assert.deepEqual(brandOpacityProblems(brand), [])
})

test('RT-01 a reference to a token the brand lacks is a problem, with its path', () => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  // Without primary-foreground there is nothing to step away from, so no primary-hover is derived.
  delete brand.color.action['primary-hover']
  delete brand.color.action['primary-foreground']
  const recipes = {
    flat: {
      probe: {
        backgroundColor: '{colors.primary-hover}',
        hover: { textColor: '{colors.nope/50}', borderColor: '{colors.border}' },
        padding: '{spacing.4}',
        rounded: '{rounded.md}',
        shadow: '{shadow.sm}',
      },
    },
    trees: { box: { base: { textColor: '{colors.foreground}' }, variants: { tone: { odd: { textColor: '{colors.nope}' } } } } },
  }
  assert.deepEqual(recipeTokenProblems(recipes, brand), [
    { recipe: 'box', at: 'variants.tone.odd.textColor', ref: '{colors.nope}' },
    { recipe: 'probe', at: 'backgroundColor', ref: '{colors.primary-hover}' },
    { recipe: 'probe', at: 'hover.textColor', ref: '{colors.nope/50}' },
  ])
})

test('RT-03 a token the contract fills in by default is never missing; a radius the brand lacks is', () => {
  const recipes = { flat: { probe: { shadow: '{shadow.xs}', typography: '{typography.heading}', rounded: '{rounded.huge}', opacity: '{opacity.50}' } } }
  assert.deepEqual(recipeTokenProblems(recipes, { radius: { md: { $value: '0.5rem' } } }), [{ recipe: 'probe', at: 'rounded', ref: '{rounded.huge}' }])
})

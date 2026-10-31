import { afterAll, beforeAll, test } from 'vitest'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { renderBaseCss, stylePresetPath } from '../src/brand.mjs'
import * as checks from '../src/lint.mjs'
import { createContent } from './content.mjs'
import { writeRecipes } from './yaml-recipes.mjs'

const workspaces = []

const UNKNOWN = 'better-tailwindcss/no-unknown-classes'
const RESTRICTED = 'better-tailwindcss/no-restricted-classes'

async function baseCss() {
  const brand = JSON.parse(await readFile(stylePresetPath('default'), 'utf8'))
  return renderBaseCss(brand, { flat: { 'button-primary': { backgroundColor: '{colors.primary}' } } })
}

/** The lint with a content dir's work dir filled in, so bodies call it as dev.mjs does. */
const lintFor = ({ workDir }) => ({
  ...checks,
  lintWorkspace: (dir, options = {}) => checks.lintWorkspace(dir, { workDir, ...options }),
  lintLibrary: (dir, options = {}) => checks.lintLibrary(dir, { workDir, ...options }),
})

let content
let lint

beforeAll(async () => {
  const ws = await createContent('.fx-classlint-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  content = ws.content
  lint = lintFor(ws)
})

afterAll(async () => {
  await Promise.all(workspaces.map((ws) => rm(ws, { recursive: true, force: true })))
})

async function lintFile(rel, source) {
  const file = path.join(content, rel)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, source)
  return lint.lintWorkspace(content, { files: [rel] })
}

/** Runs `fn` against a base.css rewritten by `transform`, restoring the original after. */
async function withBaseCss(transform, fn) {
  const cssPath = path.join(content, 'styles', 'base.css')
  const css = await readFile(cssPath, 'utf8')
  await writeFile(cssPath, transform(css))
  try {
    return await fn(cssPath)
  } finally {
    await writeFile(cssPath, css)
  }
}

const astro = (cls) => `---\n---\n<section class="${cls}">hi</section>\n`
const vue = (cls) =>
  `<script setup lang="ts">\nimport { cva } from "class-variance-authority";\nconst button = cva("inline-flex", { variants: { size: { sm: "${cls}" } } });\n</script>\n<template><button :class="button({ size: 'sm' })">x</button></template>\n`

test('CL-01 a typo is an unknown class, and the message says what to use instead', async () => {
  const problems = await lintFile('src/experiences/typo/index.astro', astro('flex flxe'))

  assert.equal(problems.length, 1)
  assert.equal(problems[0].ruleId, UNKNOWN)
  assert.match(problems[0].message, /flxe/)
  assert.match(problems[0].message, /workspace theme/)
})

test('CL-02 a stock palette class is unknown once the theme resets the defaults', async () => {
  const problems = await lintFile('src/experiences/palette/index.astro', astro('bg-blue-500'))

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split('.')[0]]),
    [[UNKNOWN, 'Unknown class detected: bg-blue-500']],
  )
})

test('CL-03 arbitrary values, bracketed or var shorthand, are restricted everywhere', async () => {
  const problems = await lintFile('src/experiences/arbitrary/index.astro', astro('p-[3px] bg-(--fui-primary) md:p-4'))

  assert.deepEqual(
    problems.map((p) => p.ruleId),
    [RESTRICTED, RESTRICTED],
  )
  assert.match(problems[0].message, /^"p-\[3px\]" uses an arbitrary value\. Use a theme utility/)
  assert.match(problems[1].message, /^"bg-\(--fui-primary\)" uses an arbitrary value/)
})

test('CL-03b only reka variables may be read as *-(--reka-*); every other var shorthand stays restricted', async () => {
  const classes = 'min-w-(--reka-select-trigger-width) data-open:max-h-(--reka-select-content-available-height) w-(--fui-select-width) max-h-(--reka) h-(--rekax-height)'
  const problems = await lintFile('src/experiences/reka/index.astro', astro(classes))

  assert.deepEqual(
    problems.map((p) => p.message.split('"')[1]),
    ['w-(--fui-select-width)', 'max-h-(--reka)', 'h-(--rekax-height)'],
  )
})

test('CL-04 arbitrary variants are restricted too: self, sibling and ancestor forms, and a child or descendant form that starts on a combinator or reads a sibling', async () => {
  const refused = [
    '[.border-b]:flex',
    'data-[slot=x]:flex',
    '[&+*]:flex',
    '[&_+_*]:flex',
    '[&_~_*]:flex',
    '[&>*+*]:flex',
    '[&>*~*]:flex',
    '[&_>_*]:flex',
    '[&>*:has(+select)]:flex',
    '[[data-x]_&]:flex',
  ]
  const problems = await lintFile('src/experiences/variant/index.astro', astro(refused.join(' ')))

  assert.deepEqual(
    problems.map((p) => p.message.split('"')[1]),
    refused,
  )
  assert.match(problems[0].message, /uses an arbitrary variant\. Use a named variant/)
})

test('CL-04b structural variants pass, group-has-[…]/name and [&_…] among them, and a sibling inside has-[…]; an arbitrary value behind one stays restricted', async () => {
  const classes = [
    '*:w-full **:shrink-0 first:mt-0 last:mb-0 [&>*]:flex [&>[data-slot=field-label]]:flex-auto [&_p:not(:last-child)]:mb-4 [&_a]:underline [&>[class~=x]]:flex',
    'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox]]:mt-px group-has-[>input]/input-group:pt-2.5',
    'has-[+*]:flex has-[~*]:flex *:not-last:not-has-[+select[aria-hidden=true]:last-child]:rounded-r-none',
    'has-[>button]:ml-[-0.45rem] [&>kbd]:rounded-[3px]',
  ].join(' ')
  const problems = await lintFile('library/components/ui/Field.vue', vue(classes))

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split('"')[1]]),
    [
      [RESTRICTED, 'has-[>button]:ml-[-0.45rem]'],
      [RESTRICTED, '[&>kbd]:rounded-[3px]'],
    ],
  )
  assert.match(problems[0].message, /uses an arbitrary value/)
})

test('CL-21 a bare data-* variant passes only on an attribute the theme names, reka sets or a component sets; any other is refused', async () => {
  const source = `<script setup lang="ts">\nimport { cva } from "class-variance-authority";\nconst row = cva("data-grow:flex has-data-grow:h-auto group-data-disabled/field:opacity-50 data-highlighted:flex data-open:flex data-side-top:flex data-size-sm:gap-2 data-checked:flex data-foo:flex group-has-data-nope/x:flex not-data-bar:flex");\n</script>\n<template><div data-grow :data-size-sm="true" :class="row()"><slot /></div></template>\n`
  const problems = await lintFile('library/components/ui/Row.vue', source)

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split('"')[1]]),
    ['data-checked:flex', 'data-foo:flex', 'group-has-data-nope/x:flex', 'not-data-bar:flex'].map((c) => [RESTRICTED, c]),
  )
  assert.match(problems[0].message, /keys on a data attribute nothing here sets/)
})

test('CL-21b the attributes a file sets: bare, bound and as an object key; a class naming one sets nothing', () => {
  assert.deepEqual(
    checks
      .dataAttributeNames(`<div data-icon :data-active="x" v-bind:data-state="y" :class="['data-open:flex', 'has-data-block:flex']"><i data-slot="z" /></div>\nh('div', { 'data-align': a })`)
      .sort(),
    ['active', 'align', 'icon', 'slot', 'state'],
  )
})

test('CL-19 tw-animate-css utilities pass, as the runtime ships them; an animation it lacks, or a value its utility refuses, stays unknown', async () => {
  const problems = await lintFile(
    'library/components/ui/Popover.vue',
    vue('animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 animate-out fade-out-0 zoom-out-95 slide-out-to-right-10 duration-100 animate-wiggle fade-in-abc'),
  )

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split('.')[0]]),
    [
      [UNKNOWN, 'Unknown class detected: animate-wiggle'],
      [UNKNOWN, 'Unknown class detected: fade-in-abc'],
    ],
  )
})

test('CL-20 the theme names reka’s states, sides and motions: exit and side-aware animations pass; an arbitrary state stays refused', async () => {
  const classes = [
    'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
    'data-state-delayed-open:animate-in data-motion-from:animate-in data-motion-to-end:slide-out-to-right-52 data-side-top:slide-in-from-bottom-2 data-side-right:slide-in-from-left-2',
    'data-side-bottom:slide-in-from-top-2 data-side-left:slide-in-from-right-2 data-open:animate-accordion-down data-closed:animate-accordion-up',
    'data-[side=bottom]:slide-in-from-top-2 data-[state=closed]:animate-out data-side-bottom:animate-wiggle',
  ].join(' ')
  const problems = await lintFile('library/components/ui/Popover.vue', vue(classes))

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split('"')[1] ?? p.message.split('.')[0]]),
    [
      [RESTRICTED, 'data-[side=bottom]:slide-in-from-top-2'],
      [RESTRICTED, 'data-[state=closed]:animate-out'],
      [UNKNOWN, 'Unknown class detected: data-side-bottom:animate-wiggle'],
    ],
  )
})

test('CL-05 a viewport variant in a library ui component fails; a container variant passes', async () => {
  const problems = await lintFile('library/components/ui/Button.vue', vue('px-2 md:px-4 max-lg:hidden @md:px-4 @max-lg:hidden'))

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split(' uses')[0]]),
    [
      [RESTRICTED, '"md:px-4"'],
      [RESTRICTED, '"max-lg:hidden"'],
    ],
  )
  assert.match(problems[0].message, /use a container variant like @md:/)
})

test('CL-06 a viewport variant in a library section or template component fails, behind other variants too', async () => {
  for (const rel of ['library/components/sections/Hero.astro', 'library/components/templates/Landing.astro']) {
    const problems = await lintFile(rel, astro('@container grid @lg:grid-cols-2 lg:grid-cols-2 hover:xl:p-4'))

    assert.deepEqual(
      problems.map((p) => p.message.split(' uses')[0]),
      ['"lg:grid-cols-2"', '"hover:xl:p-4"'],
      rel,
    )
  }
})

test('CL-07 viewport variants in experiences, recipe classes and <style> classes pass', async () => {
  const files = {
    'src/experiences/clean/index.astro': `---\n---\n<section class="hero grid md:grid-cols-2 fui-button-primary hover:bg-primary">hi</section>\n<style>\n  .hero { color: var(--fui-foreground); }\n</style>\n`,
    'library/components/ui/Badge.vue': `<template><span class="badge @sm:p-2">x</span></template>\n<style scoped>\n.badge { background: var(--fui-primary); }\n</style>\n`,
  }
  for (const [rel, source] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(content, rel)), { recursive: true })
    await writeFile(path.join(content, rel), source)
  }

  assert.deepEqual(await lint.lintWorkspace(content, { files: Object.keys(files) }), [])
})

test("CL-08 custom breakpoint names from the theme are viewport variants alongside Tailwind's", async () => {
  assert.deepEqual(lint.breakpointNames('@theme inline {\n  --breakpoint-tablet: 50rem;\n  --fui-breakpoint-x: 1px;\n}'), ['sm', 'md', 'lg', 'xl', '2xl', 'tablet'])

  const problems = await withBaseCss(
    (css) => css.replace('--breakpoint-sm:', '--breakpoint-tablet: 50rem;\n  --breakpoint-sm:'),
    () => lintFile('library/components/ui/Tablet.vue', vue('tablet:px-4 sm:px-2')),
  )

  assert.deepEqual(
    problems.map((p) => [p.ruleId, p.message.split(' uses')[0]]),
    [
      [RESTRICTED, '"tablet:px-4"'],
      [RESTRICTED, '"sm:px-2"'],
    ],
  )
})

test('CL-09 a theme change in base.css is picked up without a restart', async () => {
  const rel = 'src/experiences/theme/index.astro'
  assert.equal((await lintFile(rel, astro('bg-brandnew'))).length, 1)

  const problems = await withBaseCss(
    (css) => css.replace('--color-*: initial;', '--color-*: initial;\n  --color-brandnew: red;'),
    () => lint.lintWorkspace(content, { files: [rel] }),
  )

  assert.deepEqual(problems, [])
})

test('CL-09b a theme change is picked up even when base.css comes back with an older mtime', async () => {
  const rel = 'src/experiences/theme-old/index.astro'
  assert.equal((await lintFile(rel, astro('bg-restored'))).length, 1)

  const problems = await withBaseCss(
    (css) => css.replace('--color-*: initial;', '--color-*: initial;\n  --color-restored: red;'),
    async (cssPath) => {
      const past = new Date('2001-01-01T00:00:00Z')
      await utimes(cssPath, past, past)
      return lint.lintWorkspace(content, { files: [rel] })
    },
  )

  assert.deepEqual(problems, [])
})

test('CL-09c portrait: and landscape: are viewport variants in every library tier, fine in experiences', async () => {
  const ui = await lintFile('library/components/templates/Orientation.astro', astro('portrait:flex landscape:grid hover:landscape:p-4 not-portrait:block @md:flex'))
  const experience = await lintFile('src/experiences/orientation/index.astro', astro('portrait:flex landscape:grid'))

  assert.deepEqual(
    ui.map((p) => p.message.split(' uses')[0]),
    ['"portrait:flex"', '"landscape:grid"', '"hover:landscape:p-4"', '"not-portrait:block"'],
  )
  assert.deepEqual(experience, [])
})

test("CL-10 eslint-disable comments don't switch the lint off", async () => {
  const problems = await lintFile('src/experiences/disable/index.astro', `---\n---\n<!-- eslint-disable -->\n<section class="bg-blue-500">hi</section>\n`)

  assert.equal(problems.length, 1)
})

test("CL-11 a file that doesn't parse is left to astro build to report", async () => {
  assert.deepEqual(await lintFile('src/experiences/broken/Broken.vue', `<template><div class="flex">x</template>\n`), [])
})

test('CL-12 a whole-workspace run skips files outside src/ and library/components/', async () => {
  await lintFile('src/experiences/scope/index.astro', astro('flxe'))
  await mkdir(path.join(content, 'library', 'notes'), { recursive: true })
  await writeFile(path.join(content, 'library', 'notes', 'Draft.vue'), `<template><b class="flxe" /></template>\n`)

  const files = new Set((await lint.lintWorkspace(content)).map((p) => p.file))

  assert.ok(files.has('src/experiences/scope/index.astro'))
  assert.ok(!files.has('library/notes/Draft.vue'))
})

test('CL-13 lintFailure names the first file up front and caps the list at 20 lines', () => {
  const problem = (n) => ({
    file: `src/f${n}.astro`,
    line: 3,
    column: n,
    ruleId: UNKNOWN,
    message: `Unknown class detected: x${n}.`,
  })
  const one = lint.lintFailure([problem(1)])
  assert.equal(one.logTail, `src/f1.astro:3:1 ${UNKNOWN} Unknown class detected: x1.`)
  assert.equal(one.message, `Class lint failed at src/f1.astro:3:1 (1 problem(s)), so the build did not run:\n${one.logTail}`)

  const many = lint.lintFailure(Array.from({ length: 25 }, (_, i) => problem(i + 1)))
  const lines = many.logTail.split('\n')
  assert.equal(lines.length, 21)
  assert.equal(lines[19], `src/f20.astro:3:20 ${UNKNOWN} Unknown class detected: x20.`)
  assert.equal(lines[20], '… and 5 more')
  assert.match(many.message, /^Class lint failed at src\/f1\.astro:3:1 \(25 problem\(s\)\)/)
})

test('CL-15 lintLibrary lints library/components only; a clean library has no problems', async () => {
  const ws = await createContent('.fx-classlint-lib-', {
    baseCss: await baseCss(),
  })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await writeRecipes(path.join(ws.content, 'library'), "  button-primary:\n    backgroundColor: '{colors.primary}'")
  await write('src/experiences/promo/index.astro', astro('flex bg-blue-500'))
  await write('library/components/ui/Clean.vue', vue('px-4 fui-button-primary'))

  assert.deepEqual(await runtimeLint.lintLibrary(ws.content), [])

  await write('library/components/ui/Wide.vue', vue('md:px-4'))
  const problems = await runtimeLint.lintLibrary(ws.content)

  assert.deepEqual(
    problems.map((p) => [p.file, p.ruleId]),
    [['library/components/ui/Wide.vue', RESTRICTED]],
  )
})

test('CL-20 lintLibrary reports a recipe file that is not JSON, as a recipe-classes problem on that file’s first line', async () => {
  const ws = await createContent('.fx-classlint-yaml-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await write('library/recipes/chip.json', '{ "base": ')
  await write('library/components/ui/chip/Chip.vue', '<template><i class="flex" /></template>\n')
  const problems = await runtimeLint.lintLibrary(ws.content)
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.column, p.ruleId]),
    [['library/recipes/chip.json', 1, 1, 'frontic/recipe-classes']],
  )
  assert.match(problems[0].message, /^recipes\/chip\.json: not JSON: /)
})

test('CL-21 lintLibrary reports each recipe value the contract refuses, as a recipe-classes problem on its file’s first line', async () => {
  const ws = await createContent('.fx-classlint-values-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await write('library/recipes/shared/disabled.json', '{ "disabled": { "opacity": "0.5" } }\n')
  await write('library/components/ui/chip/Chip.vue', '<template><i class="flex" /></template>\n')
  const problems = await runtimeLint.lintLibrary(ws.content)
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.column, p.ruleId, p.message, p.severity]),
    [['library/recipes/shared/disabled.json', 1, 1, 'frontic/recipe-classes', 'disabled.opacity: 0.5 — opacity takes {opacity.<name>}', 'error']],
  )
})

test('CL-21b lintLibrary reads the trees in component manifests too, and reports a refused value on the manifest that holds it', async () => {
  const ws = await createContent('.fx-classlint-manifest-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await write('library/components/ui/chip/chip.json', '{ "recipes": { "chip": { "base": { "opacity": "0.5" } } } }\n')
  await write('library/components/ui/chip/Chip.vue', '<template><i class="flex" /></template>\n')
  const problems = await runtimeLint.lintLibrary(ws.content)
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.column, p.ruleId, p.severity]),
    [['library/components/ui/chip/chip.json', 1, 1, 'frontic/recipe-classes', 'error']],
  )
  assert.match(problems[0].message, /opacity takes \{opacity\.<name>\}/)
})

test('CL-22 lintLibrary reports an untyped recipe property as a warning, beside the errors, so it never fails the build alone', async () => {
  const ws = await createContent('.fx-classlint-untyped-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await write('library/recipes/shared/card.json', '{ "card": { "cursor": "pointer" } }\n')
  await write('library/components/ui/chip/Chip.vue', '<template><i class="flex" /></template>\n')
  const problems = await runtimeLint.lintLibrary(ws.content)
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.column, p.ruleId, p.message, p.severity]),
    [['library/recipes/shared/card.json', 1, 1, 'frontic/recipe-classes', 'card.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value', 'warning']],
  )
})

test('CL-24 lintErrors keeps the errors; lintFailure over warnings alone still names a file, for a caller that throws on any problem', () => {
  const warning = { file: 'library/recipes/card.json', line: 1, column: 1, ruleId: 'frontic/recipe-classes', message: 'card.cursor: untyped', severity: 'warning' }
  const error = { file: 'src/a.astro', line: 2, column: 3, ruleId: UNKNOWN, message: 'Unknown class detected: x.', severity: 'error' }
  assert.deepEqual(lint.lintErrors([warning, error, { ...error, severity: undefined }]), [error, { ...error, severity: undefined }])
  const failure = lint.lintFailure([warning])
  assert.equal(failure.logTail, 'library/recipes/card.json:1:1 frontic/recipe-classes card.cursor: untyped')
  assert.match(failure.message, /^Class lint failed at library\/recipes\/card\.json:1:1 \(1 problem\(s\)\)/)
})

test('CL-23 lintFailure counts and lists errors only; a warning never fails the build', () => {
  const warning = { file: 'library/recipes/card.json', line: 1, column: 1, ruleId: 'frontic/recipe-classes', message: 'card.cursor: untyped', severity: 'warning' }
  const error = { file: 'src/a.astro', line: 2, column: 3, ruleId: UNKNOWN, message: 'Unknown class detected: x.', severity: 'error' }
  const failure = lint.lintFailure([warning, error])
  assert.equal(failure.logTail, `src/a.astro:2:3 ${UNKNOWN} Unknown class detected: x.`)
  assert.match(failure.message, /^Class lint failed at src\/a\.astro:2:3 \(1 problem\(s\)\)/)
})

test('CL-19 lintLibrary reports a component whose cva drifted from its recipe tree, as a problem on the cva’s line', async () => {
  const ws = await createContent('.fx-classlint-mirror-', { baseCss: await baseCss() })
  workspaces.push(ws.ws)
  const write = async (rel, source) => {
    const file = path.join(ws.content, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  const runtimeLint = lintFor(ws)
  await writeRecipes(path.join(ws.content, 'library'), "  chip:\n    base: {}\n    variants:\n      size:\n        sm: { height: '{spacing.6}' }\n    defaults: { size: sm }")
  const chip = (sm) =>
    `<script setup lang="ts">\nimport { cva } from 'class-variance-authority'\nconst chip = cva('fui-chip', { variants: { size: { sm: '${sm}' } }, defaultVariants: { size: 'sm' } })\n</script>\n<template><i :class="chip({ size: 'sm' })" /></template>\n`
  await write('library/components/ui/chip/Chip.vue', chip('fui-chip-sm'))
  assert.deepEqual(await runtimeLint.lintLibrary(ws.content), [])

  await write('library/components/ui/chip/Chip.vue', chip('fui-chip-sm h-6'))
  const problems = await runtimeLint.lintLibrary(ws.content)
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.ruleId, p.message]),
    [['library/components/ui/chip/Chip.vue', 3, 'frontic/recipe-classes', 'chip: variants.size.sm holds "fui-chip-sm h-6"; the tree makes it "fui-chip-sm"']],
  )
})

test('CL-16 lintLibrary rebuilds base.css from the brand.json and recipe files on disk before linting', async () => {
  const ws = await createContent('.fx-classlint-theme-', {
    baseCss: await baseCss(),
  })
  workspaces.push(ws.ws)
  const runtimeLint = lintFor(ws)
  const brand = JSON.parse(await readFile(stylePresetPath('default'), 'utf8'))
  brand.font.size.huge = { $value: { value: 5, unit: 'rem' } }
  await mkdir(path.join(ws.content, 'library', 'components', 'ui'), { recursive: true })
  await writeFile(path.join(ws.content, 'library', 'brand.json'), JSON.stringify(brand))
  await writeRecipes(path.join(ws.content, 'library'), "  card:\n    backgroundColor: '{colors.card}'")
  const rel = 'library/components/ui/Card.vue'
  await writeFile(path.join(ws.content, rel), vue('text-huge fui-card'))

  const stale = await runtimeLint.lintWorkspace(ws.content, { files: [rel] })
  assert.deepEqual(
    stale.map((p) => p.message.split('.')[0]),
    ['Unknown class detected: text-huge', 'Unknown class detected: fui-card'],
  )

  assert.deepEqual(await runtimeLint.lintLibrary(ws.content), [])
  assert.match(await readFile(path.join(ws.content, 'styles', 'base.css'), 'utf8'), /--text-huge: var\(--fui-text-huge\);/)
})

test("CL-17 src/ files know every <style> class in the workspace; library files know only the library's", async () => {
  const files = {
    'src/experiences/nest/index.astro': `---\n---\n<section class="nest-card">hi</section>\n<style>\n  .nest-card :global(.nest-title) { color: var(--fui-primary); }\n</style>\n`,
    'src/experiences/nest/Title.vue': `<template><h2 class="nest-title nest-typo lib-slot">x</h2></template>\n`,
    'library/components/ui/Slot.vue': `<template><div class="lib-slot">x</div></template>\n<style scoped>\n.lib-slot { padding: var(--fui-spacing); }\n</style>\n`,
    'library/components/ui/Frame.vue': `<template><div class="lib-slot nest-card">x</div></template>\n`,
  }
  for (const [rel, source] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(content, rel)), { recursive: true })
    await writeFile(path.join(content, rel), source)
  }

  const child = await lint.lintWorkspace(content, { files: ['src/experiences/nest/Title.vue'] })
  assert.deepEqual(
    child.map((p) => [p.file, p.message.split('.')[0]]),
    [['src/experiences/nest/Title.vue', 'Unknown class detected: nest-typo']],
  )
  const library = await lint.lintWorkspace(content, {
    files: ['library/components/ui/Slot.vue', 'library/components/ui/Frame.vue'],
  })
  assert.deepEqual(
    library.map((p) => [p.file, p.message.split('.')[0]]),
    [['library/components/ui/Frame.vue', 'Unknown class detected: nest-card']],
  )
})

test('CL-18 lintLibrary finds Tailwind for a content and work dir outside any node_modules tree', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), 'fx-classlint-tmp-'))
  workspaces.push(ws)
  const contentDir = path.join(ws, 'content')
  const workDir = path.join(ws, 'work')
  const write = async (rel, source) => {
    const file = path.join(contentDir, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  await write('styles/base.css', await baseCss())
  await writeRecipes(path.join(contentDir, 'library'), "  button-primary:\n    backgroundColor: '{colors.primary}'")
  await write('library/components/ui/Typo.vue', vue('flxe'))

  for (let run = 0; run < 2; run++) {
    const problems = await checks.lintLibrary(contentDir, { workDir })
    assert.deepEqual(
      problems.map((p) => [p.file, p.ruleId]),
      [['library/components/ui/Typo.vue', UNKNOWN]],
    )
  }
})

const PROJECT = { sources: ['components/**/*.vue', 'app/**/*.vue'], components: 'components', theme: 'frontic.css' }

/** A project laid out as the CLI installs it: components/, app/ and frontic.css at the root. */
async function projectWith(files, layout = {}) {
  const ws = await mkdtemp(path.join(os.tmpdir(), '.fx-project-lint-'))
  workspaces.push(ws)
  const dir = path.join(ws, 'project')
  const brand = JSON.parse(await readFile(stylePresetPath('default'), 'utf8'))
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'frontic.css'), renderBaseCss(brand, {}, { scope: 'root' }))
  for (const [rel, source] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true })
    await writeFile(path.join(dir, rel), source)
  }
  const found = await checks.lintWorkspace(dir, { workDir: path.join(ws, 'work'), layout: { ...PROJECT, ...layout } })
  const of = (file) => found.filter((p) => p.file === file).map((p) => `${p.ruleId} ${p.message.split('.')[0]}`)
  of.messages = (file) => found.filter((p) => p.file === file).map((p) => p.message)
  return of
}

test('CL-40 a project layout lints its components against its own theme', async () => {
  const of = await projectWith({
    'components/ui/x/X.vue': '<template><div class="bg-blue-500 text-[13px] bg-primary fui-nope rounded-md" /></template>\n',
    'app/pages/index.vue': '<template><div class="bg-red-600" /></template>\n',
  })
  const component = of('components/ui/x/X.vue')
  assert.equal(component.length, 3, component.join('\n'))
  assert.ok(component.some((p) => p.startsWith(UNKNOWN) && p.includes('bg-blue-500')))
  assert.ok(component.some((p) => p.startsWith(RESTRICTED) && p.includes('text-[13px]')))
  assert.ok(component.some((p) => p.startsWith(UNKNOWN) && p.includes('fui-nope')))
  assert.deepEqual(
    of('app/pages/index.vue').map((p) => p.split(' ')[0]),
    [UNKNOWN],
  )
}, 120_000)

test('CL-43 a component may key its slot content on a data attribute the page sets; a page may not', async () => {
  const of = await projectWith({
    'components/ui/x/X.vue': '<template><div class="**:data-icon:shrink-0 data-ghost:hidden"><slot /></div></template>\n',
    'app/pages/index.vue': '<template><div class="*:data-crumb:hidden" /></template>\n',
  })
  const component = of('components/ui/x/X.vue')
  assert.deepEqual(
    component.map((p) => p.split(' ')[0]),
    [RESTRICTED],
    component.join('\n'),
  )
  assert.ok(component[0].includes('data-ghost'))
  assert.deepEqual(
    of('app/pages/index.vue').map((p) => p.split(' ')[0]),
    [RESTRICTED],
  )
}, 120_000)

test('CL-44 a project layout names where its theme comes from in the unknown-class hint', async () => {
  const of = await projectWith({ 'app/pages/index.vue': '<template><div class="bg-blue-500" /></template>\n' }, { themeSource: 'library/brand.json and library/recipes/' })
  const [problem] = of.messages('app/pages/index.vue')
  assert.ok(problem.includes('library/brand.json and library/recipes/'), problem)
  assert.ok(!problem.includes('styles/base.css'), problem)
}, 120_000)

test('CL-45 in a project, raw text is an installed item’s problem, not the app’s own component’s', async () => {
  const text = '<template><span>Add to cart</span></template>\n'
  const of = await projectWith({ 'components/AppHeader.vue': text, 'components/sections/x/X.vue': text })
  assert.deepEqual(of('components/AppHeader.vue'), [])
  assert.deepEqual(
    of('components/sections/x/X.vue').map((p) => p.split(' ')[0]),
    ['@intlify/vue-i18n/no-raw-text'],
  )
}, 120_000)

test('CL-41 raw text is checked in the layout components only', async () => {
  const text = '<template><span>Add to cart</span></template>\n'
  const of = await projectWith({ 'components/ui/x/X.vue': text, 'app/pages/index.vue': text })
  assert.deepEqual(
    of('components/ui/x/X.vue').map((p) => p.split(' ')[0]),
    ['@intlify/vue-i18n/no-raw-text'],
  )
  assert.deepEqual(of('app/pages/index.vue'), [])
}, 120_000)

test('CL-42 a component that does not parse is a parse error in a project layout', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), '.fx-project-lint-'))
  workspaces.push(ws)
  const dir = path.join(ws, 'project')
  await mkdir(path.join(dir, 'components/ui/x'), { recursive: true })
  await writeFile(path.join(dir, 'frontic.css'), '')
  await writeFile(path.join(dir, 'components/ui/x/Broken.vue'), '<script setup lang="ts">\nconst = 1\n</script>\n<template><div class="bg-primary" /></template>\n')
  const found = await checks.lintWorkspace(dir, { workDir: path.join(ws, 'work'), layout: PROJECT })
  assert.deepEqual(
    found.map(({ file, ruleId, severity }) => ({ file, ruleId, severity })),
    [{ file: 'components/ui/x/Broken.vue', ruleId: 'parse', severity: 'error' }],
  )
}, 120_000)

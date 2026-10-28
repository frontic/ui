import { test } from 'vitest'
import assert from 'node:assert/strict'
import { IMPORT, barrelFile, deepImportProblems, exampleFile, forwardsAttrs, importCode, importsOf, importTarget, itemFolder, itemShapeProblems, mainFile, pascalName } from '../src/item.mjs'

const UI = 'components/ui/button'
const button = (files) => ({
  name: 'button',
  type: 'registry:ui',
  files: files.map(([path, type = 'registry:ui']) => ({ path: `${UI}/${path}`, type })),
})
const FULL = button([['Button.vue'], ['index.ts'], ['button.example.vue', 'registry:example']])
const EXAMPLE = `<script setup lang="ts">
import { Button } from ".";
defineOptions({ inheritAttrs: false });
</script>
<template>
  <Button v-bind="$attrs">Add to cart</Button>
</template>
`
const texts = (over = {}) => ({
  [`${UI}/Button.vue`]: '<template><button /></template>',
  [`${UI}/index.ts`]: 'export { default as Button } from "./Button.vue";\n',
  [`${UI}/button.example.vue`]: EXAMPLE,
  ...over,
})

test("IT-01 an item's folder, main, example and barrel are named after it and listed", () => {
  assert.equal(itemFolder(FULL), UI)
  assert.equal(pascalName('product-card'), 'ProductCard')
  assert.equal(mainFile(FULL), `${UI}/Button.vue`)
  assert.equal(exampleFile(FULL), `${UI}/button.example.vue`)
  assert.equal(barrelFile(FULL), `${UI}/index.ts`)
  assert.equal(itemFolder({ name: 'Bad', type: 'registry:ui' }), null)
  assert.equal(itemFolder({ name: 'x', type: 'registry:lib' }), null)
})

test("IT-02 a main is the folder-named file of the item's type; none is fine", () => {
  const parts = button([['Trigger.vue'], ['index.ts'], ['button.example.vue', 'registry:example']])
  assert.equal(mainFile(parts), null)
  assert.equal(mainFile(button([['Button.vue', 'registry:example']])), null)
  assert.equal(exampleFile(button([['button.example.vue', 'registry:ui']])), null)
  assert.equal(exampleFile(button([['other.example.vue', 'registry:example']])), null)
})

test('IT-03 a well-formed item has no shape problems', () => {
  assert.deepEqual(itemShapeProblems({ item: FULL, files: texts() }), [])
})

test('IT-04 a missing barrel, a barrel of another type and one not exporting the main fail', () => {
  const noBarrel = button([['Button.vue'], ['button.example.vue', 'registry:example']])
  assert.match(itemShapeProblems({ item: noBarrel, files: texts() })[0].message, /index\.ts/)
  const lib = button([['Button.vue'], ['index.ts', 'registry:lib'], ['button.example.vue', 'registry:example']])
  assert.equal(itemShapeProblems({ item: lib, files: texts() }).length, 1)
  const silent = texts({ [`${UI}/index.ts`]: 'export {};\n' })
  assert.deepEqual(
    itemShapeProblems({ item: FULL, files: silent }).map((p) => p.message),
    [`${UI}/index.ts must export ./Button.vue`],
  )
})

test('IT-05 an item needs its main example; further ones are <name>.<slug>.example.vue', () => {
  const missing = button([['Button.vue'], ['index.ts']])
  const misnamed = button([['Button.vue'], ['index.ts'], ['sizes.example.vue', 'registry:example']])
  for (const item of [missing, misnamed]) {
    const messages = itemShapeProblems({ item, files: texts() }).map((p) => p.message)
    assert.ok(
      messages.some((m) => m.includes(`needs its main example, ${UI}/button.example.vue`)),
      messages.join('\n'),
    )
  }
  const extras = button([
    ['Button.vue'],
    ['index.ts'],
    ['button.example.vue', 'registry:example'],
    ['button.sale.example.vue', 'registry:example'],
    ['button.two-tone.example.vue', 'registry:example'],
  ])
  assert.deepEqual(itemShapeProblems({ item: extras, files: texts() }), [])
  assert.equal(exampleFile(extras), `${UI}/button.example.vue`)
  for (const stray of ['sizes.example.vue', 'button.example.example.vue', 'button.main.example.vue', 'button.Sale.example.vue', 'button..example.vue']) {
    const item = button([['Button.vue'], ['index.ts'], ['button.example.vue', 'registry:example'], [stray, 'registry:example']])
    assert.deepEqual(
      itemShapeProblems({ item, files: texts() }).map((p) => p.message),
      [`${UI}/${stray} is no example of button; a further example is ${UI}/button.<slug>.example.vue`],
      stray,
    )
  }
})

test("IT-06 forwarding: inheritAttrs off and $attrs on the main's tag, however it is written", () => {
  const ok = (exampleText) => forwardsAttrs({ examplePath: `${UI}/button.example.vue`, exampleText, folder: UI, main: 'Button' })
  assert.equal(ok(EXAMPLE), true)
  assert.equal(
    ok(`<script setup lang="ts">
import B from "./Button.vue"
defineOptions({ name: "Demo", inheritAttrs: false })
</script>
<template>
  <b-x />
  <B
    title="a > b"
    @click="go"
    v-bind="$attrs"
  />
</template>`),
    true,
  )
  assert.equal(
    ok(`<script setup>
import { Button as Main } from "@library/components/ui/button";
defineOptions({ inheritAttrs: false });
</script>
<template><main-x /><main v-bind="$attrs" /></template>`),
    false,
  )
  assert.equal(
    ok(`<script setup>
import { Button } from "./index";
defineOptions({ inheritAttrs: false });
</script>
<template><button-wrapper><button v-bind="$attrs" /></button-wrapper><Button /></template>`),
    false,
  )
  assert.equal(ok(EXAMPLE.replace('defineOptions({ inheritAttrs: false });', '')), false)
  assert.equal(
    ok(`<script setup>
import ProductCard from "./ProductCard.vue";
import { Button } from ".";
defineOptions({ inheritAttrs: false });
</script>
<template><div v-bind="$attrs"><Button /></div></template>`),
    false,
  )
  assert.equal(ok(EXAMPLE.replace('import { Button } from ".";', 'import { Button } from ".";\n').replace('<Button v-bind', '<button-x /><button v-bind')), false)
})

test("IT-07 a file importing into another item's folder is a deep import; the folder and its own files are not", () => {
  const card = 'components/ui/card/Card.vue'
  const code = (...specs) => `<script setup lang="ts">\n${specs.map((s) => `import X from "${s}";`).join('\n')}\n</script>\n`
  assert.deepEqual(
    deepImportProblems(card, code('@library/components/ui/badge/Badge.vue', '../price/Price.vue', '@library/components/ui/badge', './Card.vue', '.', 'vue')).map((p) => [
      p.specifier,
      p.folder,
      p.line,
    ]),
    [
      ['@library/components/ui/badge/Badge.vue', 'components/ui/badge', 2],
      ['../price/Price.vue', 'components/ui/price', 3],
    ],
  )
  assert.match(deepImportProblems(card, code('../price/Price.vue'))[0].message, /@library\/components\/ui\/price/)
  const experience = 'src/experiences/sale/Hero.astro'
  assert.deepEqual(
    deepImportProblems(
      experience,
      '---\nimport { Hero } from "@library/components/sections/hero";\nimport H from "@library/components/sections/hero/Hero.vue";\nimport L from "../../lib/x";\n---\n',
    ).map((p) => p.line),
    [3],
  )
  const relative = deepImportProblems(experience, '---\nimport { Card } from "../../../library/components/ui/card";\nimport C from "../../../library/components/ui/card/Card.vue";\n---\n')
  assert.deepEqual(
    relative.map((p) => [p.line, p.folder]),
    [[3, 'components/ui/card']],
  )
  assert.match(relative[0].message, /@library\/components\/ui\/card$/)
  assert.equal(importTarget(card, '../../../../x'), null)
})

test("IT-08 the item's own files are checked for deep imports; comments are ignored", () => {
  const files = texts({
    [`${UI}/Button.vue`]: '<script setup>\n// import X from "@library/components/ui/badge/Badge.vue"\nimport B from "@library/components/ui/badge/Badge.vue";\n</script>\n',
  })
  assert.deepEqual(
    itemShapeProblems({ item: FULL, files }).map((p) => p.path),
    ['files'],
  )
})

test('IT-09 an item without a main needs an example and a barrel, but no forwarding', () => {
  const parts = button([['Trigger.vue'], ['index.ts'], ['button.example.vue', 'registry:example']])
  const files = {
    [`${UI}/Trigger.vue`]: '<template><b /></template>',
    [`${UI}/index.ts`]: 'export { default as Trigger } from "./Trigger.vue";\n',
    [`${UI}/button.example.vue`]: '<script setup>\nimport { Trigger } from ".";\n</script>\n<template><Trigger /></template>\n',
  }
  assert.deepEqual(itemShapeProblems({ item: parts, files }), [])
})

test('IT-10 a file whose text is missing is skipped by the text rules, not reported', () => {
  assert.deepEqual(itemShapeProblems({ item: FULL, files: {} }), [])
})

test('IT-11 a commented-out tag or export does not satisfy forwarding or the barrel', () => {
  const example = EXAMPLE.replace('<Button v-bind="$attrs">', '<!-- <Button v-bind="$attrs" /> -->\n  <Button>')
  assert.deepEqual(itemShapeProblems({ item: FULL, files: texts({ [`${UI}/button.example.vue`]: example }) }).length, 1)
  for (const barrel of ['// export { default as Button } from "./Button.vue";\n', '/* export { default as Button } from "./Button.vue"; */\nexport {};\n']) {
    assert.deepEqual(
      itemShapeProblems({ item: FULL, files: texts({ [`${UI}/index.ts`]: barrel }) }).map((p) => p.message),
      [`${UI}/index.ts must export ./Button.vue`],
    )
  }
})

test('IT-12 an attribute after v-bind="$attrs" on the main\'s tag fails; the message says last', () => {
  const ok = (tag) =>
    forwardsAttrs({
      examplePath: `${UI}/button.example.vue`,
      exampleText: EXAMPLE.replace('<Button v-bind="$attrs">', tag),
      folder: UI,
      main: 'Button',
    })
  assert.equal(ok('<Button v-bind="$attrs" variant="primary">'), false)
  assert.equal(ok('<Button variant="primary" v-bind="$attrs">'), true)
  assert.equal(ok('<Button variant="primary" v-bind="$attrs" />'), true)
  assert.equal(ok('<Button v-bind="$attrs" disabled>'), false)
  const late = EXAMPLE.replace('<Button v-bind="$attrs">', '<Button v-bind="$attrs" variant="primary">')
  assert.match(itemShapeProblems({ item: FULL, files: texts({ [`${UI}/button.example.vue`]: late }) })[0].message, /v-bind="\$attrs" last on <Button>/)
})

test('IT-13 a quoted from or import is a string, not an import', () => {
  const file = 'components/ui/filter/Filter.ts'
  const source = `import x from 'y'\nconst range = (val) => 'from' in val || 'to' in val\nconst lazy = () => import('z')\nconst word = "import" + 'from'\n`
  assert.deepEqual(
    [...importCode(file, source).matchAll(IMPORT)].map((m) => m[2]),
    ['y', 'z'],
  )
  assert.deepEqual(
    importsOf(file, source).map((i) => i.specifier),
    ['y', 'z'],
  )
})

const FORMAT = { name: 'format', type: 'registry:lib', files: [{ path: 'lib/format.ts', type: 'registry:lib' }] }
const USE_THING = { name: 'use-thing', type: 'registry:composable', files: [{ path: 'composables/use-thing.ts', type: 'registry:composable' }] }

test('IT-14 a lib or composable item is one <folder>/<name>.ts and nothing else', () => {
  assert.deepEqual(itemShapeProblems({ item: FORMAT, files: { 'lib/format.ts': 'export const x = 1\n' } }), [])
  assert.deepEqual(itemShapeProblems({ item: USE_THING, files: { 'composables/use-thing.ts': 'export const x = 1\n' } }), [])
  const withVue = { ...FORMAT, files: [...FORMAT.files, { path: 'lib/Format.vue', type: 'registry:lib' }] }
  assert.match(itemShapeProblems({ item: withVue, files: {} })[0].message, /exactly one file, lib\/format\.ts/)
  const nested = { ...FORMAT, files: [{ path: 'lib/format/index.ts', type: 'registry:lib' }] }
  assert.match(itemShapeProblems({ item: nested, files: {} })[0].message, /exactly one file/)
  const wrongType = { ...FORMAT, files: [{ path: 'lib/format.ts', type: 'registry:ui' }] }
  assert.equal(itemShapeProblems({ item: wrongType, files: {} }).length, 1)
  const inLib = { ...USE_THING, files: [{ path: 'lib/use-thing.ts', type: 'registry:composable' }] }
  assert.match(itemShapeProblems({ item: inLib, files: {} })[0].message, /a composables item is exactly one file, composables\/use-thing\.ts/)
})

test('IT-15 a lib or composable item with a recipe fails', () => {
  const owned = { ...FORMAT, recipes: { format: { base: 'x' } } }
  assert.match(itemShapeProblems({ item: owned, files: {} })[0].message, /has no recipes/)
  const composing = { ...USE_THING, composes: ['focus-ring'] }
  assert.match(itemShapeProblems({ item: composing, files: {} })[0].message, /has no recipes/)
})

test('IT-16 a lib file may import a lib item, but not past a component barrel', () => {
  const ok = { 'lib/format.ts': "import { x } from '@library/lib/cart'\n" }
  assert.deepEqual(itemShapeProblems({ item: FORMAT, files: ok }), [])
  const deep = { 'lib/format.ts': "import X from '@library/components/ui/price/Price.vue'\n" }
  assert.match(itemShapeProblems({ item: FORMAT, files: deep })[0].message, /import the item's folder/)
})

test('IT-17 an item carrying meta.frontic.recipes fails; other meta keys pass', () => {
  const props = { frontic: { props: { variant: 'default' }, source: 'stack' } }
  assert.deepEqual(itemShapeProblems({ item: { ...FULL, meta: props }, files: texts() }), [])
  assert.deepEqual(itemShapeProblems({ item: { ...FORMAT, meta: props }, files: { 'lib/format.ts': 'export const x = 1\n' } }), [])
  const carries = (name) => ({ path: 'meta', message: `${name} carries meta.frontic.recipes, the map before 0.13.0; list its own trees under recipes and its shared recipes under composes` })
  const button = { ...FULL, meta: { frontic: { ...props.frontic, recipes: { default: 'button' } } } }
  assert.deepEqual(itemShapeProblems({ item: button, files: texts() }), [carries('button')])
  assert.deepEqual(itemShapeProblems({ item: { ...FORMAT, meta: { frontic: { recipes: {} } } }, files: {} }), [carries('format')])
})

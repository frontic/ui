import { afterAll, test } from 'vitest'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { typecheckLibrary } from '../src/typecheck.mjs'
import { createContent } from './content.mjs'

const workspaces = []

afterAll(async () => {
  await Promise.all(workspaces.map((ws) => rm(ws, { recursive: true, force: true })))
})

const LABEL = 'examples/product-slider/new-arrivals'

const overrides = (products) => ({
  item: 'product-slider',
  example: 'new-arrivals',
  data: { products },
})

async function write(file, text) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, text)
}

/** A template slider over typed products and its example. */
async function workspace({ card } = {}) {
  const { ws, content, workDir } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  const library = path.join(content, 'library')
  await write(path.join(content, '.frontic', 'generated-types.d.ts'), "declare global {\n  type ProductCard = { key: string; name?: string; badge?: 'new' | 'sale' }\n}\nexport {}\n")
  await write(
    path.join(library, 'components/templates/product-slider/ProductSlider.vue'),
    '<script setup lang="ts">\ndefineProps<{ products: ProductCard[] }>()\n</script>\n<template><ul><li v-for="p in products" :key="p.key">{{ p.name }}</li></ul></template>\n',
  )
  await write(
    path.join(library, 'components/templates/product-slider/product-slider.example.vue'),
    '<script setup lang="ts">\nimport ProductSlider from "./ProductSlider.vue"\ndefineOptions({ inheritAttrs: false })\nwithDefaults(defineProps<{ products?: ProductCard[]; heading?: string }>(), { products: () => [], heading: "Hi" })\n</script>\n<template><h2>{{ heading }}</h2><ProductSlider :products="products" v-bind="$attrs" /></template>\n',
  )
  const items = [
    {
      name: 'product-slider',
      type: 'registry:block',
      files: [
        { path: 'components/templates/product-slider/ProductSlider.vue', type: 'registry:block' },
        {
          path: 'components/templates/product-slider/product-slider.example.vue',
          type: 'registry:example',
        },
      ],
      meta: {
        frontic: {
          props: [
            { name: 'products', kind: 'data', type: 'ProductCard[]', required: true, from: 'main' },
            { name: 'heading', kind: 'behaviour', type: 'string', required: false, from: 'example' },
          ],
        },
      },
    },
  ]
  if (card) {
    await write(
      path.join(library, 'components/ui/price/Price.vue'),
      '<script setup lang="ts">\ndefineProps<{ product: ProductCard }>()\n</script>\n<template><span>{{ product.name }}</span></template>\n',
    )
    await write(
      path.join(library, 'components/sections/product-card/ProductCard.vue'),
      `<script setup lang="ts">\nimport Price from "@library/components/ui/price/Price.vue"\n</script>\n<template><Price ${card} /></template>\n`,
    )
    items.push({
      name: 'product-card',
      type: 'registry:component',
      files: [
        {
          path: 'components/sections/product-card/ProductCard.vue',
          type: 'registry:component',
        },
      ],
      meta: { frontic: {} },
    })
  }
  await write(path.join(library, 'registry.json'), JSON.stringify({ name: 'library', homepage: '', items }, null, 2) + '\n')
  return { workDir, contentDir: content }
}

test('LT-01 static data that fits the props typechecks clean', { timeout: 120_000 }, async () => {
  const dirs = await workspace()
  assert.deepEqual(await typecheckLibrary({ ...dirs, overrides: overrides([{ key: 'a', badge: 'new' }]) }), { problems: [] })
  assert.deepEqual(await typecheckLibrary(dirs), { problems: [] })
  assert.ok(!existsSync(path.join(dirs.contentDir, '.library-check')))
})

test('LT-02 static data off its prop type is reported against the example', { timeout: 120_000 }, async () => {
  const { problems } = await typecheckLibrary({
    ...(await workspace()),
    overrides: overrides([{ key: 'a', badge: 'hot' }]),
  })
  assert.equal(problems.length, 1)
  assert.equal(problems[0].ruleId, 'TS2322')
  assert.equal(problems[0].file, LABEL)
  assert.equal(problems[0].line, 1)
  assert.match(problems[0].message, /^products: /)
})

test('LT-03 a component passing a wrong prop to a typed child is reported in that component', { timeout: 120_000 }, async () => {
  const { problems } = await typecheckLibrary(await workspace({ card: ':product="1"' }))
  assert.deepEqual(
    problems.map((p) => [p.file, p.ruleId]),
    [['library/components/sections/product-card/ProductCard.vue', 'TS2322']],
  )
})

test('LT-04 without overrides no example data is checked; overrides check one example for the run only', { timeout: 120_000 }, async () => {
  const dirs = await workspace()
  const { problems } = await typecheckLibrary({
    ...dirs,
    overrides: overrides([{ key: 'b', badge: 'hot' }]),
  })
  assert.deepEqual(
    problems.map((p) => p.file),
    [LABEL],
  )
  assert.deepEqual(await typecheckLibrary(dirs), { problems: [] })
})

test('LT-05 a library without project types still typechecks its components', { timeout: 120_000 }, async () => {
  const { ws, content, workDir } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  await write(path.join(content, 'library/components/ui/badge/Badge.vue'), '<script setup lang="ts">\ndefineProps<{ label: string }>()\n</script>\n<template><span>{{ label }}</span></template>\n')
  assert.deepEqual(await typecheckLibrary({ workDir, contentDir: content }), {
    problems: [],
  })
})

test('LT-06 a vue-tsc that cannot run throws instead of passing', async () => {
  const { ws, content, workDir } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  await assert.rejects(
    typecheckLibrary({
      contentDir: content,
      workDir,
      vueTscBin: path.join(ws, 'missing', 'vue-tsc.js'),
    }),
    /vue-tsc exited 1/,
  )
})

test('LT-08 an error inside a multi-line static value names its own prop, not the one after it', { timeout: 120_000 }, async () => {
  const dirs = await workspace()
  const slider = path.join(dirs.contentDir, 'library/components/templates/product-slider/ProductSlider.vue')
  await writeFile(
    slider,
    '<script setup lang="ts">\ndefineProps<{ products: ProductCard[]; featured?: ProductCard[] }>()\n</script>\n<template><ul><li v-for="p in products" :key="p.key">{{ p.name }}</li></ul></template>\n',
  )
  const { problems } = await typecheckLibrary({
    ...dirs,
    overrides: {
      ...overrides([]),
      data: {
        products: [
          { key: 'a', name: 'A' },
          { key: 'b', name: 'B' },
          { key: 'c', badge: 'hot' },
        ],
        featured: [{ key: 'd', name: 'D' }, { key: 'e' }],
      },
    },
  })
  assert.deepEqual(
    problems.map((p) => [p.file, p.ruleId, p.message.split(':')[0]]),
    [[LABEL, 'TS2322', 'products']],
  )
})

test('LT-09 a work dir that is not a separate absolute dir is refused before anything is written', async () => {
  const { ws, content } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  const sentinel = path.join(content, 'library', 'keep.txt')
  await write(sentinel, 'keep\n')
  const relative = `.fx-libtype-relative-${process.pid}`
  for (const workDir of ['', relative, '/', content, path.join(content, 'library'), ws]) {
    await assert.rejects(typecheckLibrary({ contentDir: content, workDir }), (error) => {
      assert.ok(error.message.includes(JSON.stringify(workDir)), error.message)
      return true
    })
    assert.ok(existsSync(sentinel), `workDir ${JSON.stringify(workDir)} wiped the content`)
  }
  assert.ok(!existsSync(path.resolve(relative)))
})

test("LT-10 an example prop's static value is typed against the example", { timeout: 120_000 }, async () => {
  const dirs = await workspace()
  const clean = await typecheckLibrary({
    ...dirs,
    overrides: { item: 'product-slider', example: 'new-arrivals', data: { heading: 'Sale' } },
  })
  assert.deepEqual(clean, { problems: [] })
  const { problems } = await typecheckLibrary({
    ...dirs,
    overrides: { item: 'product-slider', example: 'new-arrivals', data: { heading: 7 } },
  })
  assert.deepEqual(
    problems.map((p) => [p.file, p.ruleId, p.message.split(':')[0]]),
    [[LABEL, 'TS2322', 'heading']],
  )
})

test('LT-12 an item without a main types every value against its example', { timeout: 120_000 }, async () => {
  const dirs = await workspace()
  const registryFile = path.join(dirs.contentDir, 'library', 'registry.json')
  const registry = JSON.parse(await readFile(registryFile, 'utf8'))
  registry.items[0].files = registry.items[0].files.filter((f) => f.type === 'registry:example')
  await writeFile(registryFile, JSON.stringify(registry))
  const { problems } = await typecheckLibrary({
    ...dirs,
    overrides: { item: 'product-slider', example: 'new-arrivals', data: { heading: 7 } },
  })
  assert.deepEqual(
    problems.filter((p) => p.file === LABEL).map((p) => p.message.split(':')[0]),
    ['heading'],
  )
})

test('LT-13 a canvas importing a library file through @assets typechecks clean', { timeout: 120_000 }, async () => {
  const { ws, content, workDir } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  await write(
    path.join(content, 'library/styleguide/brand/campaign.example.vue'),
    '<script setup lang="ts">\nimport hero from "@assets/brand/photo/hero.jpg"\nconst src: string = hero\n</script>\n<template><img :src="src" alt="" /></template>\n',
  )
  assert.deepEqual(await typecheckLibrary({ workDir, contentDir: content }), { problems: [] })
})

/** A canvas that imports a runtime module the contract does not know, and that module's types outside the content dir. */
async function specimenCanvas(use) {
  const { ws, content, workDir } = await createContent('.fx-libtype-')
  workspaces.push(ws)
  const types = path.join(ws, 'runtime/specimens.d.ts')
  await write(types, 'export declare function swatch(token: string): string\n')
  await write(
    path.join(content, 'library/styleguide/brand/colors.example.vue'),
    `<script setup lang="ts">\nimport { swatch } from "@frontic/specimens"\n${use}\n</script>\n<template><span /></template>\n`,
  )
  return { workDir, contentDir: content, types }
}

test('LT-14 paths maps a runtime module, and the canvas is checked against its real types', { timeout: 120_000 }, async () => {
  const fits = await specimenCanvas('const label: string = swatch("primary")')
  assert.deepEqual(await typecheckLibrary({ workDir: fits.workDir, contentDir: fits.contentDir, paths: { '@frontic/specimens': [fits.types] } }), { problems: [] })
  assert.deepEqual(
    (await typecheckLibrary({ workDir: fits.workDir, contentDir: fits.contentDir })).problems.map((p) => p.ruleId),
    ['TS2307'],
  )
  const off = await specimenCanvas('const label: number = swatch("primary")')
  assert.deepEqual(
    (await typecheckLibrary({ workDir: off.workDir, contentDir: off.contentDir, paths: { '@frontic/specimens': [off.types] } })).problems.map((p) => p.ruleId),
    ['TS2322'],
  )
})

test('LT-15 paths cannot remap what the contract maps itself', async () => {
  const { workDir, contentDir } = await specimenCanvas('')
  for (const key of ['@library/*', '@frontic/source']) {
    await assert.rejects(typecheckLibrary({ workDir, contentDir, paths: { [key]: ['/elsewhere'] } }), new RegExp(`${key.replace(/[*/]/g, '\\$&')} is the contract's own mapping`))
  }
})

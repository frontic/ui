import { test } from 'vitest'
import assert from 'node:assert/strict'
import { UnknownLibraryImportError, registryDependencies } from '../src/dependencies.mjs'

const FOLDER = {
  'registry:ui': 'ui',
  'registry:component': 'sections',
  'registry:block': 'templates',
}

function item(name, type, files, deps) {
  const dir = `components/${FOLDER[type]}/${name}`
  return {
    name,
    type,
    files: files.map((file) => ({
      path: `${dir}/${file}`,
      type: file.endsWith('.example.vue') ? 'registry:example' : type,
    })),
    ...(deps ? { registryDependencies: deps } : {}),
    meta: { frontic: { examples: [] } },
  }
}

const sfc = (...imports) => `<script setup lang="ts">\n${imports.map((i) => `import X from "${i}";`).join('\n')}\n</script>\n<template><div /></template>\n`

test('LD-01 an item importing two others through @library derives both, sorted', () => {
  const registry = {
    items: [item('price', 'registry:ui', ['Price.vue']), item('badge', 'registry:ui', ['Badge.vue']), item('card', 'registry:ui', ['Card.vue'])],
  }
  const deps = registryDependencies(registry, {
    'components/ui/card/Card.vue': sfc('@library/components/ui/price/Price.vue', '@library/components/ui/badge/Badge.vue'),
  })
  assert.deepEqual(deps.get('card'), ['badge', 'price'])
  assert.deepEqual(deps.get('price'), [])
})

test("LD-02 a relative import into another item's folder counts, from an example too", () => {
  const registry = {
    items: [item('card', 'registry:ui', ['Card.vue']), item('button', 'registry:ui', ['Button.vue']), item('product-card', 'registry:component', ['ProductCard.vue', 'product-card.example.vue'])],
  }
  const deps = registryDependencies(registry, {
    'components/sections/product-card/ProductCard.vue': sfc('../../ui/card/Card.vue'),
    'components/sections/product-card/product-card.example.vue': `<script setup>\nimport ProductCard from './ProductCard.vue'\nimport('../../ui/button/Button.vue')\n</script>`,
  })
  assert.deepEqual(deps.get('product-card'), ['button', 'card'])
})

test('LD-03 a self-import and non-library imports are ignored', () => {
  const registry = { items: [item('button', 'registry:ui', ['Button.vue', 'button.example.vue'])] }
  const deps = registryDependencies(registry, {
    'components/ui/button/Button.vue': sfc('vue', 'class-variance-authority', '@frontic/source', './button.css', '@library/components/ui/button/Button.vue'),
    'components/ui/button/button.example.vue': sfc('./Button.vue', '../button/Button.vue'),
  })
  assert.deepEqual(deps.get('button'), [])
})

test('LD-04 an import into an unknown item folder fails, naming the file and the import', () => {
  const registry = { items: [item('card', 'registry:ui', ['Card.vue'])] }
  const run = (spec) => registryDependencies(registry, { 'components/ui/card/Card.vue': sfc(spec) })
  for (const spec of ['@library/components/ui/ribbon/Ribbon.vue', '../ribbon/Ribbon.vue']) {
    assert.throws(
      () => run(spec),
      (error) =>
        error instanceof UnknownLibraryImportError && error.code === 'unknown-library-import' && error.message === `components/ui/card/Card.vue imports ${spec}, which is no item in registry.json`,
    )
  }
  // card is a ui item: a sections/card folder is still no item.
  assert.throws(() => run('@library/components/sections/card/Card.vue'), UnknownLibraryImportError)
})

test("LD-08 commented-out imports and a .vue file's template text are not imports", () => {
  const registry = {
    items: [item('card', 'registry:ui', ['Card.vue']), item('badge', 'registry:ui', ['Badge.vue'])],
  }
  const deps = (text) => registryDependencies(registry, { 'components/ui/card/Card.vue': text }).get('card')
  const script = (body) => `<script setup lang="ts">\n${body}\n</script>\n`
  assert.deepEqual(
    deps(
      script(
        [
          '// import x from "../zzz/Z.vue"',
          '/* from "@library/components/ui/q/Q.vue" */',
          '/*',
          ' * import y from "../yyy/Y.vue"',
          ' */',
          'const url = "https://x.test"; // import z from "../z/Z.vue"',
          'const glob = "./*.vue";',
          'import Badge from "../badge/Badge.vue";',
        ].join('\n'),
      ) + '<template><p>Shop from "../zzz/Z.vue"</p></template>\n',
    ),
    ['badge'],
  )
})

test('LD-09 a string that reads like an import is not one', () => {
  const registry = { items: [item('card', 'registry:ui', ['Card.vue']), item('note', 'registry:ui', ['Note.vue'])] }
  const deps = registryDependencies(registry, {
    'components/ui/note/Note.vue': `<script setup>\nconst hint = "copy from '../card/Card.vue'"\nconst range = (val) => 'from' in val || 'to' in val\n</script>`,
  })
  assert.deepEqual(deps.get('note'), [])
})

test('LD-20 an item importing a lib and a composable item derives both; those items derive their own', () => {
  const flat = (name, type, folder) => ({ name, type, files: [{ path: `${folder}/${name}.ts`, type }] })
  const registry = {
    items: [item('price', 'registry:ui', ['Price.vue']), flat('format', 'registry:lib', 'lib'), flat('use-field-control', 'registry:composable', 'composables'), flat('cart', 'registry:lib', 'lib')],
  }
  const deps = registryDependencies(registry, {
    'components/ui/price/Price.vue': sfc('@library/lib/format', '@library/composables/use-field-control'),
    'lib/cart.ts': "import { formatPrice } from '@library/lib/format'\n",
  })
  assert.deepEqual(deps.get('price'), ['format', 'use-field-control'])
  assert.deepEqual(deps.get('cart'), ['format'])
})

test('LD-21 an import of a lib item no registry entry names throws', () => {
  const registry = { items: [item('price', 'registry:ui', ['Price.vue'])] }
  assert.throws(() => registryDependencies(registry, { 'components/ui/price/Price.vue': sfc('@library/lib/format') }), UnknownLibraryImportError)
})

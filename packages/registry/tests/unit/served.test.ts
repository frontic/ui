import { describe, expect, it } from 'vitest'
import type { SourceItem } from '../../scripts/lib/items'
import { composesOf } from '@frontic/library-contract/recipe'
import { importedPackages, libraryDependencies, SERVE_COMPOSES_LIST, servedItem, usedFamilies } from '../../scripts/lib/served'

const badge: SourceItem = {
  name: 'badge',
  tier: 'ui',
  type: 'registry:ui',
  files: {
    'Badge.vue': `<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { Dot } from './parts'
import { Button } from '@library/components/ui/button'
</script>
<template><span class="fui-badge">from 'not-an-import'</span></template>`,
    'index.ts': "export { default as Badge } from './Badge.vue'",
    'badge.example.vue': "<script setup lang=\"ts\">\nimport { Badge } from '.'\nimport { CheckIcon } from '@lucide/vue'\nimport { Field } from '@library/components/ui/field'\n</script>",
  },
}
const recipes = {
  flat: { pill: { rounded: '{rounded.full}' }, 'focus-ring': { outline: '{border.focus}' }, unused: { textColor: '{colors.foreground}' } },
  trees: { badge: { base: { extends: 'pill' }, variants: { tone: { a: { backgroundColor: '{colors.primary}' } } } } },
}
const composed = { composes: ['focus-ring'], ...recipes.trees.badge }
const entry = { name: 'badge', title: 'Badge', recipes: { badge: composed } }
const withComposed = { ...recipes, trees: { badge: composed } }

describe('importedPackages', () => {
  it('names the packages script code loads, scoped and deep imports by package, vue and local paths left out', () => {
    expect(importedPackages({ 'X.vue': "<script>import a from 'reka-ui/date'\nimport b from '@vueuse/core/x'\nimport c from 'vue'\nimport d from '#x'\nimport e from 'node:fs'</script>" })).toEqual([
      '@vueuse/core',
      'reka-ui',
    ])
  })
  it('reads a .vue file’s script blocks only', () => {
    expect(importedPackages({ 'X.vue': "<template>import x from 'leaked'</template>" })).toEqual([])
  })
})

describe('libraryDependencies', () => {
  it('names the other items imported through @library, never the item itself', () => {
    expect(
      libraryDependencies('badge', {
        'a.ts': "import { B } from '@library/components/ui/button'\nimport { C } from '@library/components/ui/badge'\nimport x from '@library/components/sections/hero/Hero.vue'",
      }),
    ).toEqual(['button', 'hero'])
  })

  it('names the lib and composable items imported through @library', () => {
    expect(libraryDependencies('price', { 'a.ts': "import { formatPrice } from '@library/lib/format'\nimport { useFieldControl } from '@library/composables/use-field-control'" })).toEqual([
      'format',
      'use-field-control',
    ])
  })
})

describe('servedItem', () => {
  it('serves library paths, the example as registry:example, the dependencies its installed files import, its own trees, what it composes and only the shared recipes it needs', () => {
    const served = servedItem(badge, entry, withComposed)
    expect(served.files.map((f) => [f.path, f.type])).toEqual([
      ['components/ui/badge/Badge.vue', 'registry:ui'],
      ['components/ui/badge/index.ts', 'registry:ui'],
      ['components/ui/badge/badge.example.vue', 'registry:example'],
    ])
    expect(served.dependencies).toEqual(['class-variance-authority', 'reka-ui'])
    expect(served.registryDependencies).toEqual(['button'])
    expect(served).not.toHaveProperty('meta')
    expect(served.recipes).toEqual({ badge: composed })
    expect(served).not.toHaveProperty('composes')
    expect(served).not.toHaveProperty('shared')
    expect(served.library).toEqual({ recipes: { 'focus-ring': recipes.flat['focus-ring'], pill: recipes.flat.pill } })
    expect(served.title).toBe('Badge')
  })

  it('serves the families a pair uses, found under with', () => {
    const trees = { badge: { base: { extends: 'pill' }, variants: { tone: { a: { with: { size: { s: { extends: 'unused' } } } } }, size: { s: {} } } } }
    expect(usedFamilies(trees.badge)).toEqual(['pill', 'unused'])
    expect(Object.keys(servedItem(badge, { ...entry, recipes: trees }, { ...recipes, trees }).library!.recipes)).toEqual(['pill', 'unused'])
  })
  it('takes what each tree composes into library.recipes, and lists the union top level only behind the switch', () => {
    const part = { composes: ['unused', 'focus-ring'], base: {} }
    const trees = { badge: composed, 'badge-dot': part }
    const both = servedItem(badge, { ...entry, recipes: trees }, { ...recipes, trees })
    expect(Object.keys(both.library!.recipes)).toEqual(['focus-ring', 'pill', 'unused'])
    expect(both).not.toHaveProperty('composes')
    expect(servedItem(badge, { ...entry, recipes: trees }, { ...recipes, trees }, {}, { serveComposesList: true }).composes).toEqual(composesOf({ recipes: trees }))
    expect(SERVE_COMPOSES_LIST).toBe(false)
  })

  it('refuses a composed recipe no recipe file defines', () => {
    const ghost = { composes: ['ghost'], ...recipes.trees.badge }
    expect(() => servedItem(badge, { ...entry, recipes: { badge: ghost } }, { ...recipes, trees: { badge: ghost } })).toThrow(/ghost/)
  })

  it('serves no composes and no library when it has neither', () => {
    const served = servedItem(badge, { name: 'badge', recipes: { badge: {} } }, { flat: {}, trees: { badge: { base: {} } } })
    expect(served.recipes).toEqual({ badge: { base: {} } })
    expect(served).not.toHaveProperty('composes')
    expect(served).not.toHaveProperty('library')
  })

  it('refuses an entry for another item', () => {
    expect(() => servedItem(badge, { ...entry, name: 'button' }, recipes)).toThrow(/button/)
  })
})

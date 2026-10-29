import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { IconPlaceholder } from '../../icon-placeholder'
import { parseLucideImports } from '../../scripts/lib/icon-imports'
import type { SourceItem } from '../../scripts/lib/items'
import { formatOptionsFor, servedFiles } from '../../scripts/lib/served-files'
import { licenceLines } from '../../scripts/lib/licence'

const names = { lucide: 'StarIcon', tabler: 'IconStar', hugeicons: 'StarIcon', phosphor: 'StarIcon', remixicon: 'RiStarLine' }
const rating: SourceItem = {
  name: 'rating',
  tier: 'ui',
  type: 'registry:ui',
  files: {
    'Rating.vue': `<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { HeartIcon } from '@lucide/vue'
</script>

<template>
  <IconPlaceholder lucide="StarIcon" tabler="IconStar" hugeicons="StarIcon" phosphor="StarIcon" remixicon="RiStarLine" class="size-4" data-icon />
  <component :is="HeartIcon" />
</template>
`,
    'index.ts': "export { default as Rating } from './Rating.vue'\n",
  },
}

describe('IconPlaceholder', () => {
  it('renders the Lucide icon with the attributes it was given', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(IconPlaceholder, { ...names, class: 'size-4' }) }))
    expect(html).toMatch(/^<svg[^>]*class="[^"]*size-4/)
  })

  it('renders nothing for a name @lucide/vue does not export', async () => {
    expect(await renderToString(createSSRApp({ render: () => h(IconPlaceholder, { ...names, lucide: 'NopeIcon' }) }))).not.toContain('<svg')
  })
})

describe('servedFiles', () => {
  it('opens with the licence lines, then the setup script, with its icon imports added once', async () => {
    const licence = '<!-- SPDX-License-Identifier: FSL-1.1-MIT -->\n<!-- Frontic UI © Frontic · ui.frontic.com/license -->\n'
    const served = (await servedFiles(rating))['Rating.vue']!
    expect(served.match(/from '@lucide\/vue'/g)).toHaveLength(1)
    expect(served.startsWith(`${licence}<script setup lang="ts">\nimport { HeartIcon, StarIcon } from '@lucide/vue'`)).toBe(true)
  })

  it('rewrites placeholders to @lucide/vue, keeps their other attributes and value imports, formats with the repo config', async () => {
    const served = (await servedFiles(rating))['Rating.vue']!
    expect(parseLucideImports('Rating.vue', served).sort()).toEqual(['HeartIcon', 'StarIcon'])
    expect(served).toContain("from '@lucide/vue'")
    expect(served).toMatch(/<StarIcon class="size-4" data-icon \/>/)
    expect(served).not.toMatch(/IconPlaceholder|icon-placeholder|tabler=|hugeicons=/)
  })

  it("formats an example at the repo config's example width and the item's other files at its width", async () => {
    const line = '  <StarIcon class="size-4 shrink-0 fill-current text-amber-500" data-icon aria-hidden="true" />'
    const template = `<template>\n${line.replace('<StarIcon', '<IconPlaceholder lucide="StarIcon" tabler="IconStar" hugeicons="StarIcon" phosphor="StarIcon" remixicon="RiStarLine"')}\n</template>\n`
    const script = '<script setup lang="ts">\nimport { IconPlaceholder } from \'@registry/icon-placeholder\'\n</script>\n\n'
    const files = await servedFiles({ ...rating, files: { 'Rating.vue': script + template, 'rating.example.vue': script + template } })
    expect(formatOptionsFor('ui/rating/rating.example.vue').printWidth).toBe(80)
    expect(formatOptionsFor('ui/rating/Rating.vue').printWidth).toBe(200)
    expect(files['Rating.vue']).toContain(line)
    expect(files['rating.example.vue']).not.toContain(line)
    expect(Math.max(...files['rating.example.vue']!.split('\n').map((l) => l.length))).toBeLessThanOrEqual(80)
  })

  it('passes a file without a placeholder through byte for byte below its licence lines', async () => {
    expect((await servedFiles(rating))['index.ts']).toBe(`${licenceLines(rating, 'index.ts').join('\n')}\n${rating.files['index.ts']}`)
  })

  it('refuses the item when a source file breaks an icon rule, naming the file', async () => {
    const bound = { ...rating, files: { ...rating.files, 'Rating.vue': rating.files['Rating.vue']!.replace('lucide="StarIcon"', ':lucide="name"') } }
    await expect(servedFiles(bound)).rejects.toThrow('ui/rating/Rating.vue')
  })
})

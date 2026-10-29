import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readSourceItems, sourcePath } from '../../scripts/lib/items'
import { isDerived, licenceLines, withoutLicence } from '../../scripts/lib/licence'
import { servedFiles } from '../../scripts/lib/served-files'

const items = readSourceItems(join(import.meta.dirname, '../..'))
const opening = (text: string, count: number) => text.split('\n').slice(0, count)

describe('every registry item', () => {
  it('keeps no licence line in its source files', () => {
    const wrong = items.flatMap((item) => Object.entries(item.files).flatMap(([file, text]) => (withoutLicence(text) === text ? [] : [sourcePath(item, file)])))
    expect(wrong).toEqual([])
  })

  it('opens each file it serves with its licence lines, once', async () => {
    const wrong: string[] = []
    for (const item of items) {
      for (const [file, text] of Object.entries(await servedFiles(item))) {
        const lines = licenceLines(item, file)
        if (opening(text, lines.length).join('\n') !== lines.join('\n') || withoutLicence(text) !== text.split('\n').slice(lines.length).join('\n')) wrong.push(sourcePath(item, file))
      }
    }
    expect(wrong).toEqual([])
  }, 120_000)

  it('counts as derived only in ui/, by its name in shadcn-vue or the one it was renamed from', () => {
    const derived = (name: string, tier: 'ui' | 'lib' = 'ui') => isDerived({ name, tier })
    expect([derived('button'), derived('toast'), derived('rating'), derived('search'), derived('cart', 'lib')]).toEqual([true, true, false, false, false])
  })

  it('names FSL-1.1-MIT AND MIT and shadcn-vue’s copyright on an item derived from it, FSL-1.1-MIT alone on Frontic’s own', () => {
    expect(licenceLines({ name: 'button', tier: 'ui' }, 'Button.vue')).toEqual([
      '<!-- SPDX-License-Identifier: FSL-1.1-MIT AND MIT -->',
      '<!-- Frontic UI © Frontic · Portions © 2023 unovue (shadcn-vue, MIT) · ui.frontic.com/license -->',
    ])
    expect(licenceLines({ name: 'button', tier: 'ui' }, 'index.ts')).toEqual([
      '// SPDX-License-Identifier: FSL-1.1-MIT AND MIT',
      '// Frontic UI © Frontic · Portions © 2023 unovue (shadcn-vue, MIT) · ui.frontic.com/license',
    ])
    expect(licenceLines({ name: 'rating', tier: 'ui' }, 'Rating.vue')).toEqual(['<!-- SPDX-License-Identifier: FSL-1.1-MIT -->', '<!-- Frontic UI © Frontic · ui.frontic.com/license -->'])
    expect(licenceLines({ name: 'cart', tier: 'lib' }, 'cart.ts')).toEqual(['// SPDX-License-Identifier: FSL-1.1-MIT', '// Frontic UI © Frontic · ui.frontic.com/license'])
  })
})

describe('withoutLicence', () => {
  it('leaves a file as it was before its licence lines, in either form', () => {
    const body = '<script setup lang="ts">\n</script>\n'
    expect(withoutLicence(licenceLines({ name: 'button', tier: 'ui' }, 'Button.vue').join('\n') + '\n' + body)).toBe(body)
    expect(withoutLicence(licenceLines({ name: 'cart', tier: 'lib' }, 'cart.ts').join('\n') + '\nexport {}\n')).toBe('export {}\n')
    const before = '<!-- SPDX-License-Identifier: FSL-1.1-MIT -->\n<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->\n'
    expect(withoutLicence(before + body)).toBe(body)
  })
})

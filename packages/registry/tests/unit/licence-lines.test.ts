import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readSourceItems } from '../../scripts/lib/items'
import { isDerived, licenceLines, withoutLicence } from '../../scripts/lib/licence'
import { servedFiles } from '../../scripts/lib/served-files'

const items = readSourceItems(join(import.meta.dirname, '../..'))
const opening = (text: string, count: number) => text.split('\n').slice(0, count)

describe('every registry item', () => {
  it('opens each source file with its licence, and the shadcn-vue notice where it derives from it', () => {
    const wrong = items.flatMap((item) =>
      Object.entries(item.files).flatMap(([file, text]) => {
        const lines = licenceLines(item, file)
        const [first, second] = opening(text, 2)
        const derivedNotice = lines.length === 1 && second?.includes('Portions derived from shadcn-vue')
        return opening(text, lines.length).join('\n') === lines.join('\n') && !derivedNotice ? [] : [`${item.tier}/${item.name}/${file}: ${first}`]
      }),
    )
    expect(wrong).toEqual([])
  })

  it('keeps those lines first in the file it serves', async () => {
    const wrong: string[] = []
    for (const item of items) {
      for (const [file, text] of Object.entries(await servedFiles(item))) {
        const lines = licenceLines(item, file)
        if (opening(text, lines.length).join('\n') !== lines.join('\n')) wrong.push(`${item.tier}/${item.name}/${file}`)
      }
    }
    expect(wrong).toEqual([])
  }, 120_000)

  it('counts as derived only in ui/, by its name in shadcn-vue or the one it was renamed from', () => {
    const derived = (name: string, tier: 'ui' | 'lib' = 'ui') => isDerived({ name, tier })
    expect([derived('button'), derived('toast'), derived('rating'), derived('search'), derived('cart', 'lib')]).toEqual([true, true, false, false, false])
  })

  it('reads the notice from the URL the registry serves it at', () => {
    expect(licenceLines({ name: 'button', tier: 'ui' }, 'Button.vue')).toEqual([
      '<!-- SPDX-License-Identifier: FSL-1.1-MIT -->',
      '<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->',
    ])
    expect(licenceLines({ name: 'button', tier: 'ui' }, 'index.ts')).toEqual([
      '// SPDX-License-Identifier: FSL-1.1-MIT',
      '// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES',
    ])
  })
})

describe('withoutLicence', () => {
  it('leaves a file as it was before its licence lines', () => {
    const body = '<script setup lang="ts">\n</script>\n'
    expect(withoutLicence(licenceLines({ name: 'button', tier: 'ui' }, 'Button.vue').join('\n') + '\n' + body)).toBe(body)
    expect(withoutLicence(licenceLines({ name: 'cart', tier: 'lib' }, 'cart.ts').join('\n') + '\nexport {}\n')).toBe('export {}\n')
  })
})

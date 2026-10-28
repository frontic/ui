import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const PAIRS = [/colour: '([^']+)', hex: '(#[0-9a-f]{6})'/g, /exactColorHex: '(#[0-9a-f]{6})', exactColorName: '([^']+)'/g, /label: '([^']+)', hex: '(#[0-9a-f]{6})'/g]

describe('demo colours', () => {
  it('give each colour name one hex across every demo, so a filter swatch shows the colour its products wear', () => {
    const hexes = new Map<string, Set<string>>()
    const demos = ['ui', 'sections', 'templates'].flatMap((tier) => readdirSync(join(root, tier)).map((name) => join(tier, name, `${name}.example.vue`)))
    for (const file of demos) {
      const source = readFileSync(join(root, file), 'utf8')
      for (const pattern of PAIRS)
        for (const m of source.matchAll(pattern)) {
          const [name, hex] = m[1]!.startsWith('#') ? [m[2]!, m[1]] : [m[1]!, m[2]!]
          hexes.set(name, (hexes.get(name) ?? new Set()).add(hex.toLowerCase()))
        }
    }
    expect(hexes.size).toBeGreaterThan(10)
    expect(Object.fromEntries([...hexes].filter(([, set]) => set.size > 1).map(([name, set]) => [name, [...set]]))).toEqual({})
  })
})

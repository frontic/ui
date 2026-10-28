import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const PRODUCT_PRICE = /name: '([^']+)',(?:(?!name: ).)*?price: \{ ([^}]+) \}/gs

describe('demo prices', () => {
  it('give each product one price across every demo, so a product on sale is on sale in the grid, on its card and in the cart', () => {
    const prices = new Map<string, Set<string>>()
    const demos = ['ui', 'sections', 'templates'].flatMap((tier) => readdirSync(join(root, tier)).map((name) => join(tier, name, `${name}.example.vue`)))
    for (const file of demos) for (const [, name, price] of readFileSync(join(root, file), 'utf8').matchAll(PRODUCT_PRICE)) prices.set(name!, (prices.get(name!) ?? new Set()).add(price!))
    expect([...prices.values()].filter((set) => [...set].some((price) => price.includes('ref:'))).length).toBeGreaterThan(3)
    expect(Object.fromEntries([...prices].filter(([, set]) => set.size > 1).map(([name, set]) => [name, [...set]]))).toEqual({})
  })
})

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildRegistry } from '../../scripts/build'

describe('the kept sections and templates', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kept-'))
  const out = join(dir, 'v1')
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  await buildRegistry({ out })
  const read = (f: string) => JSON.parse(readFileSync(join(out, f), 'utf8'))
  const index = read('index.json')

  it('serves the kept sections and templates on base items, one contract per family, no retired block', () => {
    const SECTIONS: string[] = [
      'product-card-basic',
      'product-card-hover',
      'product-card-horizontal',
      'product-card-gallery',
      'product-card-minimal',
      'product-card-featured',
      'navigation-shop',
      'footer-rich',
      'footer-minimal',
      'footer-trust',
      'footer-brand',
      'review-cards',
      'review-list',
      'order-summary',
      'order-tracking',
      'sign-in',
      'account-access',
      'team-members',
      'recent-orders',
      'settings',
      'product-options',
      'filters',
      'reviews',
      'return-request',
      'search-suggestions',
      'cart-summary',
      'promo-code',
      'payment-method',
      'delivery-slot',
      'shipping-address',
    ]
    const TEMPLATES: string[] = [
      'header-shop',
      'header-centered',
      'header-checkout',
      'cart-item-detailed',
      'cart-item-compact',
      'cart-item-minimal',
      'cart-full',
      'cart-compact',
      'cart-minimal',
      'checkout-page',
      'filter-sidebar',
      'filter-sheet',
      'filter-toolbar',
      'category-filter',
      'category-grid',
    ]
    const RETIRED = [
      'store-nav-mega',
      'store-nav-simple',
      'store-nav-sidebar',
      'navigation-mega',
      'navigation-simple',
      'navigation-sidebar',
      'store-footer',
      'product-list',
      'product-detail',
      'product-overview',
      'product-feature-grid',
      'product-feature-list',
      'hero-split',
      'hero-centered',
      'hero-overlay',
      'promo-banner',
      'promo-feature',
      'category-preview-grid',
      'category-preview-cards',
      'incentive-bar',
      'category-page',
      'search-page',
      'order-confirmation',
      'layout-boxed',
      'layout-fullwidth',
      'layout-sidebar',
    ]
    const CONTRACTS = [
      SECTIONS.filter((n) => n.startsWith('product-card-')),
      SECTIONS.filter((n) => n.startsWith('navigation-')),
      [...TEMPLATES.filter((n) => n.startsWith('cart-')), 'order-summary', 'checkout-page'],
      TEMPLATES.filter((n) => n.startsWith('filter-') || n === 'category-filter'),
    ]
    const NAVIGATION = { 'header-shop': 'navigation-shop', 'header-centered': 'navigation-shop', 'header-checkout': 'stepper' } as Record<string, string>
    const types = new Map<string, string>(index.items.map((i: { name: string; type: string }) => [i.name, i.type]))
    const ofType = (type: string) =>
      [...types]
        .filter(([, t]) => t === type)
        .map(([n]) => n)
        .sort()
    expect(ofType('registry:component')).toEqual([...SECTIONS].sort())
    expect(ofType('registry:block')).toEqual([...TEMPLATES].sort())
    for (const name of RETIRED) expect(types.has(name), name).toBe(false)
    for (const name of [...SECTIONS, ...TEMPLATES]) {
      const item = read(`${name}.json`)
      expect(item.categories, name).toHaveLength(1)
      expect((item.registryDependencies ?? []).length, name).toBeGreaterThan(0)
      if (item.type !== 'registry:component') continue
      expect(
        item.registryDependencies.some((d: string) => types.get(d) === 'registry:ui'),
        name,
      ).toBe(true)
      for (const file of item.files) expect(file.content, file.path).not.toMatch(/@library\/components\/(?:sections|templates)\//)
    }
    for (const [header, navigation] of Object.entries(NAVIGATION)) {
      const item = read(`${header}.json`)
      expect(item.files.find((f: { path: string }) => /\/Header\w+\.vue$/.test(f.path)).content, header).toMatch(/<slot\s+name="navigation"/)
      expect(item.registryDependencies, header).toContain(navigation)
    }
    for (const group of CONTRACTS) {
      const served = group.filter((n) => types.has(n)).map((n) => read(`${n}.json`).files.find((f: { path: string }) => f.path.endsWith('/types.ts'))?.content)
      expect(
        served.every((content) => typeof content === 'string'),
        group.join(', '),
      ).toBe(true)
      expect(served.length, group.join(', ')).toBe(group.length)
      expect(new Set(served).size, group.join(', ')).toBe(1)
    }
    expect(SECTIONS).toHaveLength(30)
    expect(TEMPLATES).toHaveLength(15)
  })
})

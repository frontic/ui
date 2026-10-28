// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import type { NavigationCategory, NavigationLayout } from '../../sections/navigation-shop'
import { NavigationShop } from '../../sections/navigation-shop'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const tile = (name: string) => ({ name, href: '#', imageSrc: `/${name}.jpg`, imageAlt: name })
const categories: NavigationCategory[] = [
  {
    name: 'Women',
    featured: [tile('goggles'), tile('parka'), tile('jacket')],
    columns: [
      { name: 'Winter', links: [{ name: 'Jackets', href: '#' }] },
      { name: 'Equipment', links: [{ name: 'Backpacks', href: '#' }] },
    ],
  },
  { name: 'Men', columns: [{ name: 'Winter', links: [{ name: 'Jackets', href: '#' }] }] },
]

const mount = async (layout: NavigationLayout, props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(NavigationShop, { layout, categories, ...props }) })
  app.mount('#app')
  for (let i = 0; i < 4; i++) await nextTick()
}
const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]

describe.each(['beside', 'above', 'captioned'] as const)('the %s layout', (layout) => {
  it('leaves the mobile sheet’s close button room past the last tab, and a gap between tile rows', async () => {
    await mount(layout, { open: true })
    expect(all('[data-slot="tabs-list"]')[0]!.className).toContain('pe-14')
    expect(all('[data-slot="navigation-shop-featured-image"]')[0]!.closest('.grid')!.className).toMatch(/\bgap-y-\d/)
  })

  it(`leads the sheet’s tiles with a wide one only when captioned`, async () => {
    await mount(layout, { open: true })
    const wide = all('[role="dialog"] [data-slot="navigation-shop-featured-image"]').map((image) => image.classList.contains('aspect-2/1'))
    expect(wide).toEqual([layout === 'captioned', false, false])
  })
})

describe.each(['beside', 'above', 'captioned'] as const)('the %s flyout', (layout) => {
  it('leaves a gap between tile rows when the tiles wrap', async () => {
    await mount(layout, { menu: 'Women', categories: [{ ...categories[0]!, featured: ['a', 'b', 'c', 'd', 'e'].map(tile) }] })
    const grid = all('[data-slot="navigation-shop-content"] [data-slot="navigation-shop-featured-image"]')[0]!.closest('.grid')!
    expect(grid.className).toMatch(/\bgap-(?:y-)?\d/)
  })
})

describe('a flyout', () => {
  const open = (layout: NavigationLayout) => mount(layout, { menu: 'Women' })
  const shape = () => ({
    chevron: !!document.querySelector('[data-slot="navigation-shop-trigger"] [data-icon]'),
    captions: all('[data-slot="navigation-shop-caption"]').length,
    columns: all('[data-slot="navigation-shop-columns"]').length,
    wide: all('[data-slot="navigation-shop-content"] [data-slot="navigation-shop-featured-image"]').map((image) => image.classList.contains('col-span-2')),
  })

  it('beside puts the columns next to square tiles under chevron triggers', async () => {
    await open('beside')
    expect(shape()).toEqual({ chevron: true, captions: 0, columns: 0, wide: [false, false, false] })
  })

  it('above sets the tiles over a band of columns', async () => {
    await open('above')
    expect(shape()).toEqual({ chevron: true, captions: 0, columns: 1, wide: [false, false, false] })
  })

  it('captioned leads with a wide tile, captions every tile and drops the chevron for the underline', async () => {
    await open('captioned')
    expect(shape()).toEqual({ chevron: false, captions: 3, columns: 0, wide: [true, false, false] })
  })
})

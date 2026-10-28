// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import type { UiFilter } from '../../lib/filter-model'
import { CartSummary } from '../../sections/cart-summary'
import { ProductCardHover } from '../../sections/product-card-hover'
import { RecentOrders } from '../../sections/recent-orders'
import { ReviewCards } from '../../sections/review-cards'
import { CategoryFilter } from '../../templates/category-filter'
import { CategoryGrid } from '../../templates/category-grid'
import { FilterSheet } from '../../templates/filter-sheet'
import { FilterSidebar } from '../../templates/filter-sidebar'
import { FilterToolbar } from '../../templates/filter-toolbar'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  app?.unmount()
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.config.warnHandler = () => {}
  app.mount('#app')
  await nextTick()
  return document.body
}
const text = async (render: () => unknown) => (await mount(render)).textContent!.replace(/\s+/g, ' ')
afterEach(() => {
  app?.unmount()
  app = undefined
})

const price = { amount: 4900, currency: 'EUR' }
const products = [
  { name: 'Parka', price },
  { name: 'Goggles', price },
]
const filters: UiFilter[] = [
  {
    key: 'color',
    label: 'Colour',
    type: 'color',
    options: [{ option: 'Red', value: 'red', count: 3, selected: true }],
  },
  { key: 'inStock', label: 'In stock', type: 'boolean', options: [] },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    options: [],
    data: { total: { min: 0, max: 500, total: 9 }, result: { total: 9 } },
  },
]

describe('a results range', () => {
  it('is left out when there are no results to count', async () => {
    const grid = await text(() => h(CategoryGrid, { products, totalResults: 0 }))
    expect(grid).not.toMatch(/of 0/)
    const orders = await text(() => h(RecentOrders, { orders: [] }))
    expect(orders).not.toMatch(/0–0/)
  })
})

describe('the active-filter count', () => {
  it('leaves out a range set to nothing, in CategoryGrid as in FilterSidebar', async () => {
    const activeFilters = { price: {}, inStock: true }
    const badges = async (component: unknown) =>
      [...(await mount(() => h(component as never, { filters, activeFilters, products }))).querySelectorAll('[data-slot="badge"]')].map((b) => b.textContent!.trim())
    const grid = await badges(CategoryGrid)
    const sidebar = await badges(FilterSidebar)
    expect(grid).toContain('2')
    expect(grid).not.toContain('3')
    expect(sidebar).toContain('2')
  })
})

describe('count labels', () => {
  it('read singular for one', async () => {
    const cart = await text(() =>
      h(CartSummary, {
        lines: [{ id: 'parka', name: 'Parka', price, quantity: 1 }],
      }),
    )
    expect(cart).toContain('1 item')
    expect(cart).not.toContain('1 items')
    expect(await text(() => h(ReviewCards, { totalCount: 1, counts: [], reviews: [] }))).toContain('Based on 1 review')
    for (const component of [FilterSidebar, FilterSheet, FilterToolbar]) expect(await text(() => h(component, { filters: [], totalResults: 1 }))).toContain('1 product')
    expect(await text(() => h(CategoryFilter, { filters: [], totalResults: 1 }))).toContain('1 result')
    const orders = await text(() =>
      h(RecentOrders, {
        orders: [
          {
            number: '#1',
            date: '2026-03-01',
            status: 'shipped',
            items: ['Parka'],
            total: price,
          },
        ],
      }),
    )
    expect(orders).toContain('of 1 order')
    expect(orders).not.toContain('1 orders')
  })
})

describe('a product card', () => {
  it('shows the selected sibling’s image on the hover card too', async () => {
    const product = {
      name: 'Parka',
      price,
      cover: { src: '/parka.jpg' },
      siblings: { items: [{ key: 'red', cover: { src: '/parka-red.jpg' } }] },
    }
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(ProductCardHover, { product }))
    expect(host.querySelector('img')!.getAttribute('src')).toBe('/parka-red.jpg')
  })
})

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'
import { renderToString } from 'vue/server-renderer'
import CategoryFilter from '../../templates/category-filter/CategoryFilter.vue'
import FilterSheet from '../../templates/filter-sheet/FilterSheet.vue'
import FilterSidebar from '../../templates/filter-sidebar/FilterSidebar.vue'
import FilterToolbar from '../../templates/filter-toolbar/FilterToolbar.vue'
import type { Product, UiFilter } from '../../templates/filter-sidebar/types'

const filters: UiFilter[] = [
  {
    key: 'properties.color',
    label: 'Color',
    type: 'color',
    options: [
      { option: 'White', value: 'white', count: 24, selected: false, disabled: false },
      { option: 'Black', value: 'black', count: 42, selected: true, disabled: false },
    ],
  },
  { key: 'options.size', label: 'Size', type: 'default', options: [{ option: 'M', value: 'm', count: 22, selected: false, disabled: false }] },
  { key: 'clearout', label: 'Clearout', type: 'boolean', options: [{ option: 'Yes', value: 'true', count: 12, selected: false, disabled: false }] },
]
const products: Product[] = [
  { key: 'a', name: 'Sneakers', price: { amount: 12999, currency: 'EUR' } },
  { key: 'b', name: 'Runner', price: { amount: 5999, currency: 'EUR' } },
  { key: 'c', name: 'Boot', price: { amount: 17999, currency: 'EUR' } },
]
const props = { filters, products, sortOptions: [{ key: 'default', label: 'Relevance', value: 'default' }], locale: 'de-DE' }
const render = async (...args: Parameters<typeof h>) => (await renderToString(h(...args))).replace(/<!--.*?-->/g, '')

const ITEMS = [
  ['filter-sidebar', FilterSidebar],
  ['filter-sheet', FilterSheet],
  ['filter-toolbar', FilterToolbar],
  ['category-filter', CategoryFilter],
] as const

describe('filter templates', () => {
  it.each(ITEMS)('%s renders one product-card-basic per product and forwards locale to it', async (_, Item) => {
    const html = await render(Item, props)
    expect(html.match(/data-slot="product-card-title" class="fui-product-card-title line-clamp-2"/g)).toHaveLength(3)
    expect(html).toContain('129,99')
  })

  it.each(ITEMS)('%s lists its active filters as a tag group whose remove buttons are named by a copy prop', async (_, Item) => {
    const html = await render(Item, props)
    expect(html).toMatch(/<div class="fui-tag-group [^"]*" aria-label="Active filters"[^>]*role="grid"/)
    const button = /<button [^>]*aria-label="Remove Black"[^>]*>/.exec(html)?.[0]
    expect(button).toContain('class="fui-tag-group-item-delete ')
    expect(button).not.toContain('aria-labelledby')
    expect(html).toContain('class="fui-clear-link')
  })

  // SelectTrigger's own width sits in its recipe, so the w-full passed after it wins.
  it.each(ITEMS.filter(([name]) => name !== 'filter-sheet'))('%s takes the default brand’s 170px sort width on a wrapper the trigger fills', async (_, Item) => {
    expect(await render(Item, props)).toMatch(/<div class="w-42\.5 shrink-0"><button [^>]*data-slot="select-trigger"[^>]*class="[^"]*\bw-full\b/)
  })

  it('filter-sheet takes the default brand’s 180px sort width from @2xl on a wrapper the trigger fills', async () => {
    expect(await render(FilterSheet, props)).toMatch(/<div class="(?:[^"]*\s)?@2xl:w-45(?:\s[^"]*)?"><button [^>]*data-slot="select-trigger"[^>]*class="[^"]*\bw-full\b/)
  })

  // Button joins a passed class after its own inline-flex; a bare `hidden` loses to it, so the wrapper hides.
  it('filter-sidebar hides its panel toggle below @3xl on a wrapper, not on Button', async () => {
    const html = await render(FilterSidebar, props)
    expect(html).toMatch(/<div class="hidden @3xl:flex"><button [^>]*data-slot="button"/)
    expect(html).not.toMatch(/<button [^>]*data-slot="button"[^>]*class="[^"]*\shidden(?:\s|")/)
  })

  it.each(ITEMS)('%s mounts with a reactive filters array and shows the active chip', async (_, Item) => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(Item, { ...props, filters: reactive(filters.map((f) => ({ ...f, options: f.options.map((o) => ({ ...o })) }))) }) }))
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('[aria-label="Remove Black"]')).not.toBeNull()
    app.unmount()
  })

  it.each(ITEMS)('%s passes the facet total min and max to its price range', async (_, Item) => {
    const price: UiFilter = { key: 'price', label: 'Price', type: 'range', options: [], data: { total: { min: 50, max: 300, total: 9 }, result: { min: 50, max: 300, total: 9 } } }
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(Item, { ...props, filters: [price] }) }))
    app.mount('#app')
    await nextTick()
    ;(document.querySelector('[data-slot="sheet-trigger"]') as HTMLButtonElement | null)?.click()
    await nextTick()
    ;(document.querySelector('[data-slot="collapsible-trigger"]') as HTMLButtonElement).click()
    for (let i = 0; i < 5; i++) await nextTick()
    expect(document.body.innerHTML).toContain('aria-valuemin="50"')
    expect(document.body.innerHTML).toContain('aria-valuemax="300"')
    app.unmount()
  })

  it('category-filter rules its groups off with Separators that add no spacing of their own', async () => {
    const html = await render(CategoryFilter, props)
    const aside = /<aside class="hidden @5xl:block">([\s\S]*?)<\/aside>/.exec(html)![1]!
    expect(aside.match(/data-slot="separator"/g)).toHaveLength(filters.length - 1)
    expect(aside).toMatch(/<div data-slot="filter" class=""><div data-state="open" data-slot="collapsible" class="py-6 first:pt-0 last:pb-0">/)
    expect(aside).toMatch(/<\/div><div [^>]*data-slot="separator"[^>]*><\/div><div (?:data-state="open" data-slot="collapsible" )?class="py-6 first:pt-0 last:pb-0">/)
  })

  it('filter-sidebar removes a chip through its remove button and emits removeFilter', async () => {
    const removed: unknown[][] = []
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(FilterSidebar, { ...props, onRemoveFilter: (...args: unknown[]) => removed.push(args) }) }))
    app.mount('#app')
    await nextTick()
    ;(document.querySelector('[aria-label="Remove Black"]') as HTMLButtonElement).click()
    await nextTick()
    expect(removed).toEqual([['properties.color', 'black']])
    expect(document.querySelector('[aria-label="Remove Black"]')).toBeNull()
    app.unmount()
  })
})

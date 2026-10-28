// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ProductCardBasic from '../../sections/product-card-basic/ProductCardBasic.vue'
import ProductCardFeatured from '../../sections/product-card-featured/ProductCardFeatured.vue'
import ProductCardGallery from '../../sections/product-card-gallery/ProductCardGallery.vue'
import ProductCardHorizontal from '../../sections/product-card-horizontal/ProductCardHorizontal.vue'
import ProductCardHover from '../../sections/product-card-hover/ProductCardHover.vue'
import ProductCardMinimal from '../../sections/product-card-minimal/ProductCardMinimal.vue'
import FilterSwatch from '../../ui/filter/FilterSwatch.vue'
import Swatch from '../../ui/swatch/Swatch.vue'

const render = async (component: Parameters<typeof h>[0], props: Record<string, unknown>) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(component, props))
  return host
}

const sibling = (key: string, name: string, hex: string) => ({ key, name: 'Blizzard Defender', cover: { src: `/${key}.jpeg` }, colors: { exactColorHex: hex, exactColorName: name } })
const product = {
  name: 'Blizzard Defender',
  key: 'purple',
  price: { amount: 12600, currency: 'EUR' },
  siblings: { items: [sibling('purple', 'Purple', '#6b4c8a'), sibling('pink', 'Pink', '#e48ab0')] },
}

describe('xs swatch', () => {
  it('is a small swatch whose colour fill keeps a thin ring', async () => {
    const host = await render(Swatch, { size: 'xs', shape: 'pill', hex: '#6b4c8a' })
    expect(host.querySelector('[data-slot="swatch"]')!.className).toContain('fui-swatch-xs')
    expect(host.querySelector('[data-slot="swatch-fallback"]')!.className).toContain('fui-swatch-fallback-xs')
  })

  it('insets its colour fill by the border on every side, so a pill stays a circle', async () => {
    const fill = (await render(Swatch, { size: 'xs', shape: 'pill', hex: '#6b4c8a' })).querySelector('[data-slot="swatch-fallback"]')!
    expect([...fill.classList].filter((c) => /^(absolute|inset-px|m-px|h-full|w-full)$/.test(c))).toEqual(['absolute', 'inset-px'])
  })
})

describe('product card colours', () => {
  it.each([
    ['product-card-basic', ProductCardBasic],
    ['product-card-hover', ProductCardHover],
    ['product-card-horizontal', ProductCardHorizontal],
    ['product-card-gallery', ProductCardGallery],
    ['product-card-minimal', ProductCardMinimal],
    ['product-card-featured', ProductCardFeatured],
  ])('%s draws each colour as a named round dot, not a photo', async (_, Card) => {
    const host = await render(Card, { product })
    const dots = [...host.querySelectorAll('[data-slot="swatch-group-item"]')]
    expect(dots.map((d) => d.className.includes('fui-swatch-xs') && d.className.includes('fui-swatch-pill'))).toEqual([true, true])
    expect(host.querySelector('[data-slot="swatch-image"]')).toBeNull()
    expect(dots.map((d) => d.closest('label')!.textContent!.trim())).toEqual(['Purple', 'Pink'])
    expect(dots.map((d) => d.closest('label')!.querySelector('[data-slot="swatch-label"]')!.classList.contains('sr-only'))).toEqual([true, true])
  })

  it.each([
    ['product-card-gallery', ProductCardGallery],
    ['product-card-minimal', ProductCardMinimal],
  ])('%s puts the colours under the title, so titles in a row line up', async (_, Card) => {
    const host = await render(Card, { product })
    const title = host.querySelector('h3')!
    const dots = host.querySelector('[data-slot="swatch-group"]')!
    expect(title.compareDocumentPosition(dots) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('colour filter', () => {
  const options = [
    { value: 'purple', hex: '#6b4c8a', label: 'Purple', count: 1 },
    { value: 'pink', hex: '#e48ab0', label: 'Pink', count: 2 },
  ]

  it('lists the colours one per row by default, each a round dot beside its name and count', async () => {
    const host = await render(FilterSwatch, { options })
    expect(host.querySelector('[data-slot="filter-swatch"]')!.className).toContain('fui-swatch-group-vertical')
    const dots = [...host.querySelectorAll('[data-slot="swatch-group-item"]')]
    expect(dots.every((d) => d.className.includes('fui-swatch-xs') && d.className.includes('fui-swatch-pill'))).toBe(true)
    expect(dots.map((d) => d.closest('label')!.className)).toEqual(Array(2).fill(expect.stringContaining('flex-row')))
  })

  it('caps the list at about six and a half rows and scrolls the rest', async () => {
    const list = (await render(FilterSwatch, { options })).querySelector('[data-slot="filter-swatch"]')!
    expect([...list.classList].filter((c) => /^(max-h-|overflow-)/.test(c))).toEqual(['max-h-52', 'overflow-y-auto'])
  })

  it('still lays out in a row when asked', async () => {
    const host = await render(FilterSwatch, { options, orientation: 'horizontal' })
    expect(host.querySelector('[data-slot="filter-swatch"]')!.className).toContain('fui-swatch-group-horizontal')
    expect(host.querySelector('[data-slot="filter-swatch"]')!.className).not.toContain('max-h-')
  })
})

describe('product card width', () => {
  it.each([
    ['product-card-basic', ProductCardBasic],
    ['product-card-hover', ProductCardHover],
    ['product-card-horizontal', ProductCardHorizontal],
    ['product-card-gallery', ProductCardGallery],
    ['product-card-minimal', ProductCardMinimal],
    ['product-card-featured', ProductCardFeatured],
  ])('%s fills the cell it is given, as a grid or a column sets it', async (_, Card) => {
    const root = (await render(Card, { product })).firstElementChild!
    expect([...root.classList].filter((c) => c.startsWith('max-w-'))).toEqual([])
  })
})

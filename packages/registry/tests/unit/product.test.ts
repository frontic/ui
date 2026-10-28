import { describe, expect, it } from 'vitest'
import { useProductSibling } from '../../composables/use-product-sibling'
import type { Product } from '../../lib/product'

const product: Product = {
  key: 'parka-red',
  price: { amount: 100, currency: 'EUR' },
  cover: { src: '/parka.jpg' },
  siblings: {
    items: [{ key: 'parka-red', cover: { src: '/red.jpg' } }, { key: 'parka-blue', cover: { src: '/blue.jpg' } }, { key: 'parka-green' }],
  },
}

describe('a product sibling', () => {
  it('starts at the product and follows the selected swatch', () => {
    const { selected, cover } = useProductSibling(product)
    expect(selected.value).toBe('parka-red')
    expect(cover.value).toBe('/red.jpg')
    selected.value = 'parka-blue'
    expect(cover.value).toBe('/blue.jpg')
  })

  it("falls back to the product's cover, then the placeholder", () => {
    const { selected, cover } = useProductSibling(product)
    selected.value = 'parka-green'
    expect(cover.value).toBe('/parka.jpg')
    expect(useProductSibling({ price: product.price }).cover.value).toBe('/placeholder.svg')
  })

  it('starts at the first sibling when the product has no key', () => {
    expect(useProductSibling({ ...product, key: undefined }).selected.value).toBe('parka-red')
  })
})

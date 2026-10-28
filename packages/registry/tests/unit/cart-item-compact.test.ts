// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartItemCompact } from '../../templates/cart-item-compact'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('cart item compact', () => {
  it('names each quantity field after its item', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const items = [
      { id: 'parka', name: 'Frost Escape Parka', price: { amount: 14900, currency: 'EUR' }, quantity: 1 },
      { id: 'goggles', name: 'Snowflake Ski Goggles', price: { amount: 12700, currency: 'EUR' }, quantity: 2 },
    ]
    app = createApp({ render: () => h(CartItemCompact, { items }) })
    app.mount('#app')
    await nextTick()
    const names = [...document.querySelectorAll('[data-slot=number-field] [aria-label], [data-slot=number-field][aria-label]')].map((e) => e.getAttribute('aria-label'))
    expect(names).toEqual(expect.arrayContaining(['Quantity of Frost Escape Parka', 'Quantity of Snowflake Ski Goggles']))
  })

  it('leaves the thumbnail out of what screen readers read, since the name beside it says it', async () => {
    app?.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    const items = [{ id: 'parka', name: 'Frost Escape Parka', image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', price: { amount: 14900, currency: 'EUR' }, quantity: 1 }]
    app = createApp({ render: () => h(CartItemCompact, { items }) })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('[data-slot=image-img]')!.getAttribute('alt')).toBe('')
  })
})

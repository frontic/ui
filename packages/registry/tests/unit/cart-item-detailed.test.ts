// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartItemDetailed } from '../../templates/cart-item-detailed'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('cart item detailed', () => {
  it('names each quantity button after its item', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const items = [
      { id: 'parka', name: 'Frost Escape Parka', price: { amount: 14900, currency: 'EUR' }, quantity: 2 },
      { id: 'goggles', name: 'Snowflake Ski Goggles', price: { amount: 12700, currency: 'EUR' }, quantity: 2 },
    ]
    app = createApp({ render: () => h(CartItemDetailed, { items }) })
    app.mount('#app')
    await nextTick()
    const names = [...document.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(
      expect.arrayContaining([
        'Decrease quantity of Frost Escape Parka',
        'Increase quantity of Frost Escape Parka',
        'Decrease quantity of Snowflake Ski Goggles',
        'Increase quantity of Snowflake Ski Goggles',
      ]),
    )
  })

  it('leaves the thumbnail out of what screen readers read, since the name beside it says it', async () => {
    app?.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    const items = [{ id: 'parka', name: 'Frost Escape Parka', image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', price: { amount: 14900, currency: 'EUR' }, quantity: 1 }]
    app = createApp({ render: () => h(CartItemDetailed, { items }) })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('[data-slot=image-img]')!.getAttribute('alt')).toBe('')
  })
})

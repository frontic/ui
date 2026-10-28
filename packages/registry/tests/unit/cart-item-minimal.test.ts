// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartItemMinimal } from '../../templates/cart-item-minimal'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('cart item minimal', () => {
  it('leaves the thumbnail out of what screen readers read, since the name beside it says it', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () =>
        h(CartItemMinimal, { items: [{ id: 'parka', name: 'Frost Escape Parka', image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', price: { amount: 14900, currency: 'EUR' }, quantity: 1 }] }),
    })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('[data-slot=image-img]')!.getAttribute('alt')).toBe('')
  })
})

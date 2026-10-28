// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { OrderSummary } from '../../sections/order-summary'
import { CartFull } from '../../templates/cart-full'
import { CheckoutPage } from '../../templates/checkout-page'
import type { CartLine } from '../../lib/cart'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.config.warnHandler = () => {}
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => {
  app?.unmount()
  app = undefined
})
const line = (amount: number, quantity = 1, ref?: number): CartLine => ({ id: String(amount), name: 'Parka', price: { amount, currency: 'EUR', ref }, quantity })
const methodRow = () => document.querySelector('[data-slot="radio-accordion-trigger"]')!.textContent!.replace(/\s+/g, ' ')

describe('free shipping', () => {
  it('compares the threshold with the subtotal after promo codes at checkout', async () => {
    const address = { address: 'Hauptstr. 1', houseNumber: '1', zip: '10115', city: 'Berlin' }
    const shippingMethods = [{ value: 'standard', label: 'Standard', amount: 499, freeFrom: 5000 }]
    await mount(() => h(CheckoutPage, { items: [line(5000)], shippingMethods, defaultValues: address, freeLabel: 'Free', discounts: [{ id: 'X', kind: 'promo', label: 'X', amount: 500 }] }))
    expect(methodRow()).toContain('€4.99')
    app!.unmount()
    await mount(() => h(CheckoutPage, { items: [line(5000)], shippingMethods, defaultValues: address, freeLabel: 'Free', discounts: [{ id: 'G', kind: 'gift-card', label: 'G', amount: 500 }] }))
    expect(methodRow()).toContain('Free')
  })

  it('is free at exactly the threshold in the full cart', async () => {
    await mount(() => h(CartFull, { items: [line(10000)], freeShippingThreshold: 10000, freeShippingLabel: 'Free' }))
    expect(document.body.textContent).toContain('Free')
  })
})

describe('a cart line', () => {
  it("shows a reduced line's reference struck through in the order summary", async () => {
    await mount(() => h(OrderSummary, { items: [line(8000, 2, 10000)] }))
    expect(document.querySelector('[data-slot="price-ref"]')?.textContent).toContain('200.00')
  })
})

// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import CheckoutPage from '../../templates/checkout-page/CheckoutPage.vue'
import OrderSummary from '../../sections/order-summary/OrderSummary.vue'
import type { ShippingMethod } from '../../templates/checkout-page/checkout'

const address = { address: 'Torstraße', houseNumber: '109', zip: '10119', city: 'Berlin', country: 'DE' }

let app: App | undefined
afterEach(() => app?.unmount())

async function mount(render: () => ReturnType<typeof h>) {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(defineComponent({ setup: () => render }))
  app.mount('#app')
  await nextTick()
}

const source = readFileSync(join(import.meta.dirname, '../../templates/checkout-page/CheckoutPage.vue'), 'utf8')

const checked = () => document.querySelectorAll('[data-slot="radio-accordion-item"][data-state="checked"]').length
const settle = async (ms = 0) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
  await nextTick()
}
const submit = async () => {
  document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
const trigger = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="radio-accordion-trigger"]')].find((button) => button.textContent?.includes(label))!

const contact = { email: 'max@example.com', lastName: 'Mustermann' }
const card = { paymentMethod: 'card', cardNumber: '4242424242424242', expiry: '1228', cvc: '123', cardName: 'Max Mustermann' }
const billing = { billingSameAsShipping: false, billingCountry: 'AT', billingFirstName: 'Erika', billingLastName: 'Musterfrau', billingAddress: 'Ring 1', billingZip: '1010', billingCity: 'Wien' }

describe('checkout-page', () => {
  it('picks the first shipping method of a list that arrives after the address', async () => {
    const methods = ref<ShippingMethod[]>([])
    await mount(() => h(CheckoutPage, { defaultValues: address, shippingMethods: methods.value }))
    expect(checked()).toBe(1)
    methods.value = [{ value: 'standard', label: 'Standard', amount: 499 }]
    await nextTick()
    await nextTick()
    expect(checked()).toBe(2)
  })

  it('keeps a prefilled shipping method once a later list offers it', async () => {
    const methods = ref<ShippingMethod[]>([])
    await mount(() => h(CheckoutPage, { defaultValues: { ...address, shippingMethod: 'express' }, shippingMethods: methods.value }))
    methods.value = [
      { value: 'standard', label: 'Standard', amount: 499 },
      { value: 'express', label: 'Express', amount: 1290 },
    ]
    await nextTick()
    await nextTick()
    const picked = [...document.querySelectorAll('[data-slot="radio-accordion-item"][data-state="checked"]')].map((item) => item.textContent)
    expect(picked.some((text) => text?.includes('Express'))).toBe(true)
  })

  it('replaces a prefilled payment method the list does not offer', async () => {
    await mount(() => h(CheckoutPage, { defaultValues: { paymentMethod: 'gone' } }))
    expect(checked()).toBe(1)
  })

  it('opens the billing country on the prefilled shipping country', async () => {
    await mount(() => h(CheckoutPage, { defaultValues: { country: 'AT', billingSameAsShipping: false } }))
    expect([...document.querySelectorAll('select')].map((select) => select.value)).toEqual(['AT', 'AT'])
  })

  it('takes the card in payment-card fields: spaced, its brand shown, the expiry as MM/YY', async () => {
    await mount(() => h(CheckoutPage, { defaultValues: { paymentMethod: 'card', cardNumber: '4242424242424242', expiry: '1228' } }))
    expect(document.querySelector<HTMLInputElement>('[data-slot="payment-card-number"] input')?.value).toBe('4242 4242 4242 4242')
    expect([...document.querySelectorAll<HTMLElement>('[data-slot="payment-card-brand"]')].map((logo) => logo.dataset.brand)).toEqual(['visa'])
    expect(document.querySelector<HTMLInputElement>('[data-slot="payment-card-expiry"] input')?.value).toBe('12/28')
    expect(document.querySelector('[data-slot="payment-card-cvc"] button[aria-label]')).not.toBeNull()
  })

  it('places the order without the card and billing fields once the shopper switches to another method', async () => {
    const onPlaceOrder = vi.fn()
    await mount(() => h(CheckoutPage, { defaultValues: { ...address, ...contact, ...card, ...billing }, onPlaceOrder }))
    trigger('PayPal').click()
    await settle(50)
    await submit()
    expect(onPlaceOrder).toHaveBeenCalledTimes(1)
    const values = onPlaceOrder.mock.calls[0]![0]
    expect(values).toMatchObject({ paymentMethod: 'paypal', billingSameAsShipping: true, houseNumber: '109' })
    for (const key of Object.keys(card).filter((key) => key !== 'paymentMethod')) expect(values[key]).toBe('')
    for (const key of Object.keys(billing).filter((key) => key !== 'billingSameAsShipping')) expect(values[key]).toBe('')
  })

  it('places the order with the billing address only while it differs from the shipping one', async () => {
    const onPlaceOrder = vi.fn()
    await mount(() => h(CheckoutPage, { defaultValues: { ...address, ...contact, ...card, ...billing, billingSameAsShipping: true }, onPlaceOrder }))
    await submit()
    expect(onPlaceOrder).toHaveBeenCalledTimes(1)
    const values = onPlaceOrder.mock.calls[0]![0]
    expect(values).toMatchObject({ paymentMethod: 'card', cardNumber: '4242424242424242', cardName: 'Max Mustermann', billingSameAsShipping: true })
    for (const key of Object.keys(billing).filter((key) => key !== 'billingSameAsShipping')) expect(values[key]).toBe('')
  })

  it('places the order without a building number for a country that keeps it in the address line', async () => {
    const onPlaceOrder = vi.fn()
    await mount(() => h(CheckoutPage, { defaultValues: { ...address, ...contact, country: 'GB', paymentMethod: 'paypal' }, onPlaceOrder }))
    await submit()
    expect(onPlaceOrder).toHaveBeenCalledTimes(1)
    expect(onPlaceOrder.mock.calls[0]![0]).toMatchObject({ country: 'GB', address: 'Torstraße', houseNumber: '' })
  })

  it('heads each card so a screen reader can jump between them', async () => {
    await mount(() => h(CheckoutPage))
    expect([...document.querySelectorAll('h2')].map((heading) => heading.textContent)).toEqual(['Order summary', 'Contact', 'Delivery', 'Shipping method', 'Payment'])
  })

  it('puts the logo above the folded summary, as a phone reads the page top down', async () => {
    await mount(() => h(CheckoutPage, { storeName: 'Basecamp' }))
    const logo = document.querySelector('[data-slot="logo"]')!
    const summary = document.querySelector('[data-slot="checkout-page-summary"]')!
    expect(logo.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(summary.contains(logo)).toBe(false)
  })

  it('drops the summary card’s heading where the bar above already names it, by the page’s width', async () => {
    await mount(() => h(CheckoutPage))
    const heading = document.querySelector('[data-slot="checkout-page-summary"] [data-slot="card-header"]')!
    expect(heading.textContent).toContain('Order summary')
    const wrapper = heading.closest('[id$="-summary"]')!
    expect([...wrapper.classList]).toContain('@max-4xl/checkout:[&_[data-slot=card-header]]:hidden')
  })

  it('lays the summary beside the form by its own width, named so a Card between never answers the query', () => {
    expect(source).not.toMatch(/useElementSize|stacked/)
    expect(/data-slot="checkout-page" :class="\['fui-checkout-page-root @container\/checkout'/.test(source)).toBe(true)
    expect(source.match(/@(?:max-)?4xl[\w/-]*:/g)!.filter((variant) => !/^@(?:max-)?4xl\/checkout:$/.test(variant))).toEqual([])
  })

  it('folds the summary into the pay card bare, its total already in the bar above', () => {
    const nested = /<CollapsibleContent>\s*<div[^>]*>\s*<OrderSummary([^>]*)>/.exec(source)
    expect(nested?.[1]).toContain('surface="bare"')
    expect(nested?.[1]).toContain(':show-total="false"')
    expect(nested?.[1]).not.toMatch(/\bclass=/)
  })

  it('opens the whole summary from the total at the foot, in place of the discount button', async () => {
    await mount(() => h(CheckoutPage, { items: [{ id: 'a', name: 'Parka', price: { amount: 10000, currency: 'EUR' }, quantity: 1 }] }))
    const foot = () => document.querySelector('main')!
    expect(foot().textContent).toContain('Add discount')
    foot().querySelector('[data-slot="total"]')!.closest('button')!.click()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
    expect(foot().querySelector('[data-slot="order-summary-image"]')).not.toBeNull()
    expect(foot().querySelector('[data-slot="checkout-page-summary"]')).toBeNull()
    expect(foot().textContent).not.toContain('Add discount')
  })

  it('takes codes off once, in the summary, with a gift card chip of its own', async () => {
    const discounts = [
      { id: 'WELCOME10', kind: 'promo' as const, label: 'WELCOME10', amount: 1000 },
      { id: 'GC-1', kind: 'gift-card' as const, label: 'Gift card ••• 4821', lineLabel: 'Gift card', amount: 500 },
    ]
    await mount(() => h(CheckoutPage, { items: [{ id: 'a', name: 'Parka', price: { amount: 10000, currency: 'EUR' }, quantity: 1 }], discounts, locale: 'en-US' }))
    const summary = document.querySelector('[data-slot="checkout-page-summary"] [data-slot="card"]')!
    expect([...summary.querySelectorAll('dt')].map((row) => row.textContent)).toEqual(['Subtotal', 'WELCOME10', 'Gift card', 'Shipping'])
    expect(summary.querySelectorAll('[data-slot="badge"][data-variant="promo"]')).toHaveLength(1)
    expect(summary.querySelector('[data-slot="total"]')?.textContent).toContain('€85.00')
    expect(summary.textContent).not.toContain('To pay')
  })

  it('keeps a gift card out of the tax it notes', async () => {
    const items = [{ id: 'a', name: 'Parka', price: { amount: 11900, currency: 'EUR' }, quantity: 1 }]
    const note = async (discounts: unknown[]) => {
      await mount(() => h(CheckoutPage, { items, discounts, taxRate: 0.19, locale: 'en-US' }))
      return document.querySelector('[data-slot="checkout-page-summary"] [data-slot="total"] [data-slot="meta"]')?.textContent
    }
    const without = await note([])
    app?.unmount()
    expect(await note([{ id: 'GC-1', kind: 'gift-card', label: 'Gift card', amount: 5000 }])).toBe(without)
    expect(without).toContain('€19.00')
  })

  it('hands an applied code up and clears the field', async () => {
    const onApply = vi.fn()
    await mount(() => h(CheckoutPage, { onApplyDiscount: onApply }))
    const input = document.querySelector<HTMLInputElement>('[data-slot="checkout-page-summary"] input')!
    input.value = ' welcome10 '
    input.dispatchEvent(new Event('input'))
    await nextTick()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await nextTick()
    expect(onApply).toHaveBeenCalledWith('welcome10')
    expect(input.value).toBe('')
  })
})

describe('order-summary', () => {
  it('lists discounts under the subtotal and takes them off the total', async () => {
    await mount(() =>
      h(OrderSummary, {
        items: [{ id: 'a', name: 'Parka', price: { amount: 10000, currency: 'EUR' }, quantity: 1 }],
        discounts: [{ id: 'x', label: 'WELCOME10', amount: 1000 }],
        shippingNote: 'Calculated next',
        locale: 'en-US',
      }),
    )
    expect([...document.querySelectorAll('dt')].map((row) => row.textContent)).toEqual(['Subtotal', 'WELCOME10', 'Shipping', 'Tax'])
    expect(document.querySelector('dd [data-slot="meta"]')?.textContent).toBe('Calculated next')
    expect(document.querySelector('[data-slot="total"]')?.textContent).toContain('€90.00')
  })

  it('leaves the total out on request, where the bar around it already shows one', async () => {
    const items = [{ id: 'a', name: 'Parka', price: { amount: 10000, currency: 'EUR' }, quantity: 1 }]
    await mount(() => h(OrderSummary, { items, showTotal: false, locale: 'en-US' }))
    expect(document.querySelector('[data-slot="total"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Total')
    expect([...document.querySelectorAll('dt')].map((row) => row.textContent)).toEqual(['Subtotal', 'Shipping', 'Tax'])
  })
})

describe('the contact card', () => {
  const header = () => document.querySelector('[data-slot="card-action"]')!.parentElement!
  const classes = (slot: string) => header().querySelector(`[data-slot="${slot}"]`)!.className.split(' ')

  it('keeps "Sign in" beside the title, so the description runs the full width under both', async () => {
    await mount(() => h(CheckoutPage, { signInHref: '/account/login', contactDescription: 'We send the order confirmation here.' }))
    expect(classes('card-action')).toEqual(expect.arrayContaining(['col-start-2', 'row-start-1']))
    expect(classes('card-description')).toContain('col-span-2')
  })
})

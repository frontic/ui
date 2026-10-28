// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartSummary, type CartSummaryLine } from '../../sections/cart-summary'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  const events: string[] = []
  app = createApp({ render: () => h(CartSummary, { onCheckout: () => events.push('checkout'), ...props }) })
  app.mount('#app')
  await nextTick()
  return events
}
afterEach(() => app?.unmount())

const lines: CartSummaryLine[] = [
  { id: 'parka', name: 'Frost Escape Parka', price: { amount: 14900, currency: 'EUR' }, quantity: 1, link: { path: '/frost-escape-parka' } },
  { id: 'goggles', name: 'Snowflake Ski Goggles', price: { amount: 12700, currency: 'EUR' }, quantity: 2 },
]
const checkout = () => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Secure checkout'))!
const row = (label: string) => [...document.querySelectorAll('dt')].find((dt) => dt.textContent!.includes(label))!.nextElementSibling!

describe('cart summary', () => {
  it('names the cart in a heading', async () => {
    await mount({ lines })
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Your cart')
  })

  it('keeps the item count beside the heading at every width', async () => {
    await mount({ lines })
    expect([...document.querySelector('[data-slot=card-action]')!.classList]).toEqual(expect.arrayContaining(['col-start-2', 'row-span-2', 'row-start-1', 'justify-self-end']))
  })

  it('links a line to its product when it has a link, and leaves it plain when it has none', async () => {
    await mount({ lines })
    const titles = [...document.querySelectorAll('[data-slot=item-title]')]
    expect(titles[0]!.querySelector('a')!.getAttribute('href')).toBe('/frost-escape-parka')
    expect(titles[1]!.querySelector('a')).toBeNull()
  })

  it('lists the totals as terms and their amounts', async () => {
    await mount({ lines, shippingCents: 495, locale: 'en-US' })
    expect(row('Subtotal').tagName).toBe('DD')
    expect(row('Shipping').textContent).toContain('€4.95')
    expect(row('Total').textContent).toContain('€407.95')
  })

  it('reads shipping as worked out at checkout while it is unknown, and leaves it out of the total', async () => {
    await mount({ lines, locale: 'en-US' })
    expect(row('Shipping').textContent!.trim()).toBe('Calculated at checkout')
    expect(row('Total').textContent).toContain('€403.00')
  })

  it('shows free shipping as a badge', async () => {
    await mount({ lines, shippingCents: 0 })
    expect(row('Shipping').querySelector('[data-slot=badge]')!.textContent).toBe('Free')
  })

  it('says the cart is empty and keeps checkout off', async () => {
    const events = await mount({ lines: [] })
    expect(document.querySelector('[data-slot=card-content]')!.textContent).toContain('Your cart is empty.')
    expect(document.querySelector('[data-slot=item-group]')).toBeNull()
    expect(checkout().disabled).toBe(true)
    expect(document.querySelector('[data-slot=card-action]')).toBeNull()
    checkout().click()
    expect(events).toEqual([])
  })
})

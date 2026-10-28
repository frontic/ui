// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartCompact } from '../../templates/cart-compact'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(CartCompact, props) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const line = (quantity: number) => ({ id: 'parka', name: 'Frost Escape Parka', price: { amount: 14900, currency: 'EUR' }, quantity })
const trigger = () => document.querySelector('[data-slot=sheet-trigger]')!

describe('cart compact', () => {
  it('tells screen readers how many items the cart holds, as the badge shows it', async () => {
    await mount({ items: [line(3)] })
    expect(trigger().getAttribute('aria-label')).toBe('Open cart (3)')
    app!.unmount()
    await mount({ items: [line(12)] })
    expect(trigger().getAttribute('aria-label')).toBe('Open cart (9+)')
  })

  it('names an empty cart without a count', async () => {
    await mount({ items: [] })
    expect(trigger().getAttribute('aria-label')).toBe('Open cart')
  })
})

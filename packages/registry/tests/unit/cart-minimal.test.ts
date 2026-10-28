// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { CartMinimal } from '../../templates/cart-minimal'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(CartMinimal, props) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const line = (quantity: number) => ({ id: 'parka', name: 'Frost Escape Parka', price: { amount: 14900, currency: 'EUR' }, quantity })
const trigger = () => document.querySelector('[data-slot=popover-trigger]')!

describe('cart minimal', () => {
  it('tells screen readers how many items the cart holds, as the badge shows it', async () => {
    await mount({ items: [line(3)] })
    expect(trigger().getAttribute('aria-label')).toBe('Open cart (3)')
    app!.unmount()
    await mount({ items: [] })
    expect(trigger().getAttribute('aria-label')).toBe('Open cart')
  })

  it('names the popover after its heading', async () => {
    await mount({ items: [line(2)], open: true })
    await nextTick()
    expect(document.querySelector('[data-slot=popover-content]')!.getAttribute('aria-label')).toBe('Cart (2)')
  })
})

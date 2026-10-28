// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ProductCardBasic } from '../../sections/product-card-basic'
import { ProductCardHorizontal } from '../../sections/product-card-horizontal'
import { ProductCardHover } from '../../sections/product-card-hover'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => {
  app?.unmount()
  vi.useRealTimers()
})
const product = { name: 'Parka', price: { amount: 4900, currency: 'EUR' } }

describe('the add-to-cart button of a product card', () => {
  it.each([
    ['ProductCardBasic', ProductCardBasic, 'Add to Cart'],
    ['ProductCardHorizontal', ProductCardHorizontal, 'Add to Cart'],
    ['ProductCardHover', ProductCardHover, 'Quick add'],
  ])('%s reads Added for two seconds after a click, counted from the last click', async (_, component, idle) => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(component, { product }) })
    app.mount('#app')
    const button = () => [...document.querySelectorAll('button')].find((b) => /Added|Add to Cart|Quick add/.test(b.textContent!))!
    button().click()
    await nextTick()
    expect(button().textContent).toContain('Added')
    vi.advanceTimersByTime(1500)
    button().click()
    vi.advanceTimersByTime(1500)
    await nextTick()
    expect(button().textContent).toContain('Added')
    vi.advanceTimersByTime(600)
    await nextTick()
    expect(button().textContent).toContain(idle)
  })
})

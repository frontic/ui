// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import CartCompact from '../../templates/cart-compact/CartCompact.vue'
import CartFull from '../../templates/cart-full/CartFull.vue'
import CartMinimal from '../../templates/cart-minimal/CartMinimal.vue'

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

describe('a cart with no lines', () => {
  // Each cart is the container Empty steps its padding by, so a drawer keeps the narrow padding on a wide page.
  it.each([
    ['cart-full', CartFull, {}],
    ['cart-compact', CartCompact, { open: true }],
    ['cart-minimal', CartMinimal, { open: true }],
  ])('%s shows the Empty state: icon tile, title and description', async (_, Cart, props) => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp({ render: () => h(Cart, { items: [], ...props }) })
    app.mount('#app')
    await settle()
    const empty = document.querySelector('[data-slot="empty"]')
    const seen = {
      media: empty?.querySelector('[data-slot="empty-media"]')?.getAttribute('data-variant'),
      title: empty?.querySelector('[data-slot="empty-title"]')?.textContent?.trim(),
      description: !!empty?.querySelector('[data-slot="empty-description"]')?.textContent?.trim(),
      contained: !!empty?.parentElement?.closest('[class~="@container"]'),
    }
    app.unmount()
    expect(seen).toEqual({ media: 'icon', title: 'Your cart is empty', description: true, contained: true })
  })
})

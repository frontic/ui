// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import AddedToCart from '../../ui/popover/popover.added-to-cart.example.vue'

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}
const content = () => document.querySelector('[data-slot="popover-content"]')

it('confirms an added item from the cart, opened by Add to cart rather than by a trigger of its own', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(() => h(AddedToCart))
  app.mount('#app')
  await settle()
  expect(document.querySelector('[data-slot="popover-trigger"]')).toBeNull()
  expect(content()?.textContent).toContain('Added to cart')

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle()
  expect(content()).toBeNull()

  const add = [...document.querySelectorAll('button')].find((button) => button.textContent!.trim() === 'Add to cart')!
  add.click()
  await settle()
  expect(content()?.textContent).toContain('Frost Escape Parka')
})

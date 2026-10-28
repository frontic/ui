// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import SizeGuide from '../../ui/dialog/dialog.size-guide.example.vue'

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

it('shows a size table and measuring notes that scroll with the dialog as a whole', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(SizeGuide))
  app.mount('#app')
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))

  const content = document.querySelector('[data-slot="dialog-content"]')!
  expect(content.classList.contains('fui-dialog-content-scroll')).toBe(true)
  expect(content.querySelector('[data-slot="dialog-body"]')).toBeNull()

  // Four columns fit the table in a 360px phone's dialog; a fifth clipped the last one.
  const columns = [...content.querySelectorAll('thead th')].map((head) => head.textContent!.trim())
  expect(columns).toEqual(['Size', 'Chest', 'Waist', 'Sleeve'])
  const sizes = [...content.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')!.textContent!.trim())
  expect(sizes).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
  const notes = [...content.querySelectorAll('[data-slot="item-title"]')].map((term) => term.textContent!.trim())
  expect(notes).toEqual(['Chest', 'Waist', 'Sleeve'])
  app.unmount()
})

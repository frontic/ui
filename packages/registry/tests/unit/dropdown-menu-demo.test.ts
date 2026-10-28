// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import Demo from '../../ui/dropdown-menu/dropdown-menu.example.vue'

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

it('shows keyboard shortcuts for Orders and Sign out in the account menu', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(Demo))
  app.mount('#app')
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))

  const shortcuts = [...document.querySelectorAll('[data-slot="dropdown-menu-shortcut"]')].map((shortcut) => [
    shortcut.closest('[data-slot="dropdown-menu-item"]')!.textContent!.replace(shortcut.textContent!, '').trim(),
    shortcut.textContent!.trim(),
  ])
  expect(shortcuts).toEqual([
    ['Orders', '⇧⌘O'],
    ['Sign out', '⇧⌘Q'],
  ])
  app.unmount()
})

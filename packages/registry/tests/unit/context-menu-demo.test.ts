// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import ContextMenuDemo from '../../ui/context-menu/context-menu.example.vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

it('shows the wishlist group with its label, the shortcuts and the back-in-stock checkbox', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(ContextMenuDemo))
  app.mount('#app')
  document.querySelector('[data-slot="context-menu-trigger"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }))
  await nextTick()
  await wait(50)
  const group = document.querySelector('[data-slot="context-menu-group"]')!
  expect(group.querySelector('[data-slot="context-menu-label"]')?.textContent?.trim()).toBe('Wishlist')
  const shortcuts = [...group.querySelectorAll('[data-slot="context-menu-item"]')].map((item) => {
    const shortcut = item.querySelector('[data-slot="context-menu-shortcut"]')?.textContent ?? ''
    return [item.textContent?.replace(shortcut, '').trim(), shortcut]
  })
  expect(shortcuts).toEqual([
    ['Add to cart', '⌘↵'],
    ['Share', '⌘S'],
  ])
  const checkbox = group.querySelector<HTMLElement>('[data-slot="context-menu-checkbox-item"]')!
  expect(checkbox.textContent?.trim()).toBe('Notify me when back in stock')
  expect(checkbox.getAttribute('aria-checked')).toBe('false')
  app.unmount()
})

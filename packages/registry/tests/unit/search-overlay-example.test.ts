// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import SearchOverlayExample from '../../ui/search/search.overlay.example.vue'

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  for (let i = 0; i < 3; i++) await nextTick()
}
const overlay = () => document.querySelector('[data-slot="search-overlay"]')

it('opens the search in an overlay from the header button and closes it with Cancel', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(() => h(SearchOverlayExample))
  app.mount('#app')
  await settle()
  expect(overlay()).toBeNull()

  document.querySelector<HTMLButtonElement>('button[aria-label="Search"]')!.click()
  await settle()
  expect(overlay()?.querySelector('input')).not.toBeNull()
  expect(overlay()!.textContent).toContain('Popular searches')

  const input = overlay()!.querySelector<HTMLInputElement>('input')!
  input.value = 'parka'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
  expect(overlay()!.textContent).toContain('Frost Escape Parka')

  const cancel = overlay()!.querySelector<HTMLButtonElement>('[data-slot="search-cancel"]')!
  expect(cancel.textContent!.trim()).toBe('Cancel')
  cancel.click()
  await settle()
  expect(overlay()).toBeNull()
})

it('gives focus back to the header button after Cancel or Escape, though a click never focused it, as in Safari', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(() => h(SearchOverlayExample))
  app.mount('#app')
  await settle()
  const button = document.querySelector<HTMLButtonElement>('button[aria-label="Search"]')!
  expect(button.getAttribute('aria-haspopup')).toBe('dialog')

  for (const close of [
    () => overlay()!.querySelector<HTMLButtonElement>('[data-slot="search-cancel"]')!.click(),
    () => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  ]) {
    ;(document.activeElement as HTMLElement | null)?.blur()
    button.click()
    await settle()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    close()
    await settle()
    expect(overlay()).toBeNull()
    expect(document.activeElement).toBe(button)
  }
})

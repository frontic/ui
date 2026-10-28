// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import Demo from '../../ui/kbd/kbd.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const press = (target: EventTarget, init: KeyboardEventInit = { key: 'k', metaKey: true }) => {
  const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event.defaultPrevented
}

describe('the Kbd demo', () => {
  it('shows ⌘ K in the product search and focuses it with that shortcut', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Demo) })
    app.mount('#app')
    await nextTick()
    const input = document.querySelector('input')!
    const keys = [...document.querySelectorAll('[data-slot="kbd-group"] [data-slot="kbd"]')].map((kbd) => kbd.textContent)
    expect([keys, input.getAttribute('aria-keyshortcuts')]).toEqual([['⌘', 'K'], 'Meta+K Control+K'])
    expect(press(document.body, { key: '/' })).toBe(false)
    expect(press(document.body, { key: 'k' })).toBe(false)
    expect(press(document.body)).toBe(true)
    expect(document.activeElement).toBe(input)
    input.blur()
    expect(press(document.body, { key: 'k', ctrlKey: true })).toBe(true)
    expect(document.activeElement).toBe(input)
  })
})

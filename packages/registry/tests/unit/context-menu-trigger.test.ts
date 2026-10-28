// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import ContextMenuDemo from '../../ui/context-menu/context-menu.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

async function mount() {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(() => h(ContextMenuDemo))
  app.mount('#app')
  await nextTick()
  return document.querySelector<HTMLElement>('[data-slot="context-menu-trigger"]')!
}

describe('the context menu demo’s trigger area', () => {
  it('takes focus from the keyboard, shows the focus ring there and tells how to open its menu', async () => {
    const trigger = await mount()
    const hint = document.getElementById(trigger.getAttribute('aria-describedby') ?? '')
    expect([trigger.tabIndex, trigger.classList.contains('focus-visible:fui-focus-ring'), hint?.textContent?.trim()]).toEqual([0, true, 'Actions: right-click, or press Shift+F10 or the menu key.'])
  })

  // Shift+F10 and the ContextMenu key make the browser fire contextmenu on the focused element, here with no pointer position.
  it('opens its menu from the contextmenu event the keyboard fires on it while focused', async () => {
    const trigger = await mount()
    trigger.focus()
    const focused = document.activeElement === trigger
    trigger.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect([focused, document.querySelector('[data-slot="context-menu-content"]')?.getAttribute('data-state')]).toEqual([true, 'open'])
  })
})

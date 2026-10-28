// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

async function item(render: () => unknown, slot: string, open?: () => void) {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(defineComponent({ setup: () => render }))
  app.mount('#app')
  await settle()
  if (open) {
    open()
    await settle()
  }
  const element = document.querySelector(`[data-slot="${slot}"]`)!
  const seen = { dataColor: element.getAttribute('data-color'), color: element.getAttribute('color'), inset: element.getAttribute('inset') }
  app.unmount()
  return seen
}

describe("a menu item's color", () => {
  it.each([
    [
      'dropdown-menu',
      () =>
        h(DropdownMenu, { open: true }, () => [
          h(DropdownMenuTrigger, null, () => 'open'),
          h(DropdownMenuContent, null, () => h(DropdownMenuItem, { color: 'destructive', inset: true }, () => 'Sign out')),
        ]),
      'dropdown-menu-item',
    ],
    [
      'context-menu',
      () => h(ContextMenu, null, () => [h(ContextMenuTrigger, null, () => 'open'), h(ContextMenuContent, null, () => h(ContextMenuItem, { color: 'destructive', inset: true }, () => 'Remove'))]),
      'context-menu-item',
      () => document.querySelector('[data-slot="context-menu-trigger"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 4, clientY: 4 })),
    ],
  ] as const)('%s sets data-color and keeps color and inset off the element', async (_, render, slot, open?) => {
    expect(await item(render, slot, open)).toEqual({ dataColor: 'destructive', color: null, inset: null })
  })
})

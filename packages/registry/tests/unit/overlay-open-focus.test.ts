// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type Component } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogScrollContent, DialogTitle } from '../../ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '../../ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../../ui/sheet'

const OVERLAYS: [string, Component, Component, Component, Component][] = [
  ['Dialog', Dialog, DialogContent, DialogTitle, DialogDescription],
  ['Scrolling dialog', Dialog, DialogScrollContent, DialogTitle, DialogDescription],
  ['Sheet', Sheet, SheetContent, SheetTitle, SheetDescription],
  ['Drawer', Drawer, DrawerContent, DrawerTitle, DrawerDescription],
]

let app: ReturnType<typeof createApp> | undefined
// A fresh page has seen no key; the overlays read the last input from the window, which outlives a test.
beforeEach(() => dispatchEvent(new Event('pointerdown')))
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  for (let i = 0; i < 3; i++) await nextTick()
}

/** Mounts a trigger button and the overlay, open as `open` says, with a Save button inside. */
async function mount([, Root, Content, Title, Description]: (typeof OVERLAYS)[number], open: boolean) {
  document.body.innerHTML = '<div id="app"></div>'
  const shown = ref(open)
  app = createApp({
    render: () => [
      h('button', { id: 'trigger', type: 'button' }, 'Open'),
      h(Root, { open: shown.value }, () =>
        h(Content, null, () => [h(Title, null, () => 'Edit address'), h(Description, null, () => 'Where your order goes.'), h('button', { type: 'button' }, 'Save')]),
      ),
    ],
  })
  app.mount('#app')
  await settle()
  return shown
}
const content = () => document.querySelector<HTMLElement>('[role="dialog"]')!
const save = () => [...content().querySelectorAll('button')].find((button) => button.textContent === 'Save')!

describe.each(OVERLAYS)('a %s opening', (...overlay) => {
  it('open from the start, focuses itself, so no control inside wears a focus ring', async () => {
    await mount(overlay, true)
    expect(document.activeElement).toBe(content())
  })

  it('opened by a pointer, after a key pressed earlier, focuses itself, so no control inside wears a focus ring', async () => {
    const shown = await mount(overlay, false)
    const trigger = document.getElementById('trigger')!
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    trigger.focus()
    shown.value = true
    await settle()
    expect(document.activeElement).toBe(content())
  })

  it('opened from the keyboard, focuses its first control, which shows the ring', async () => {
    const shown = await mount(overlay, false)
    const trigger = document.getElementById('trigger')!
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    shown.value = true
    await settle()
    expect(document.activeElement).toBe(save())
  })
})

describe.each(OVERLAYS.filter(([name]) => !name.endsWith('ialog')))('a %s focused on opening', (...overlay) => {
  // Each dialog draws its edge as an outline from its recipe; the sheet and drawer would show the browser's focus outline around the whole panel.
  it('draws no focus outline of its own around the panel', async () => {
    await mount(overlay, true)
    expect(content().classList.contains('outline-none')).toBe(true)
  })
})

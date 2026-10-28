// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type Component } from 'vue'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogScrollContent, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '../../ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../../ui/sheet'

let app: ReturnType<typeof createApp> | undefined
beforeEach(() => dispatchEvent(new Event('pointerdown')))
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const dialogLike =
  (Root: Component, Trigger: Component, Content: Component, Title: Component, Description: Component, rootProps = {}, contentProps = {}) =>
  (open: boolean) =>
    h(Root, { open, ...rootProps }, () => [
      h(Trigger, null, () => 'Edit address'),
      h(Content, contentProps, () => [h(Title, null, () => 'Edit address'), h(Description, null, () => 'Where your order goes.'), h('button', { type: 'button' }, 'Save')]),
    ])

const alertDialog =
  (rootProps = {}) =>
  (open: boolean) =>
    h(AlertDialog, { open, ...rootProps }, () => [
      h(AlertDialogTrigger, null, () => 'Delete address'),
      h(AlertDialogContent, null, () => [
        h(AlertDialogTitle, null, () => 'Delete this address?'),
        h(AlertDialogDescription, null, () => 'It leaves your address book.'),
        h(AlertDialogFooter, null, () => [h(AlertDialogCancel, null, () => 'Cancel')]),
      ]),
    ])

const dropdown = (open: boolean) => h(DropdownMenu, { open }, () => [h(DropdownMenuTrigger, null, () => 'Sort'), h(DropdownMenuContent, null, () => [h(DropdownMenuItem, null, () => 'Newest')])])

// Each renders the overlay open as `open` says, with its trigger, whose data-slot prefix comes second.
const OVERLAYS: [string, string, (open: boolean) => ReturnType<typeof h>][] = [
  [
    'select',
    'select',
    (open) =>
      h(Select, { open, defaultValue: 'm' }, () => [
        h(SelectTrigger, null, () => h(SelectValue)),
        h(SelectContent, null, () => [h(SelectItem, { value: 's' }, () => 'S'), h(SelectItem, { value: 'm' }, () => 'M')]),
      ]),
  ],
  ['dialog', 'dialog', dialogLike(Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription)],
  // Mounted while it closes, as during its exit animation in a browser, where Reka focuses the trigger as soon as it closes.
  ['dialog kept mounted', 'dialog', dialogLike(Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, { unmountOnHide: false })],
  ['non-modal dialog', 'dialog', dialogLike(Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, { modal: false })],
  ['scrolling dialog', 'dialog', dialogLike(Dialog, DialogTrigger, DialogScrollContent, DialogTitle, DialogDescription)],
  ['scrolling dialog kept mounted', 'dialog', dialogLike(Dialog, DialogTrigger, DialogScrollContent, DialogTitle, DialogDescription, { unmountOnHide: false })],
  ['non-modal scrolling dialog', 'dialog', dialogLike(Dialog, DialogTrigger, DialogScrollContent, DialogTitle, DialogDescription, { modal: false })],
  ['sheet', 'sheet', dialogLike(Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription)],
  ['non-modal sheet', 'sheet', dialogLike(Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, { modal: false })],
  ['sheet kept mounted', 'sheet', dialogLike(Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, { unmountOnHide: false })],
  ['drawer', 'drawer', dialogLike(Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription)],
  ['non-modal drawer', 'drawer', dialogLike(Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription, { modal: false })],
  ['dropdown-menu', 'dropdown-menu', dropdown],
  ['alert-dialog', 'alert-dialog', alertDialog()],
  ['alert-dialog kept mounted', 'alert-dialog', alertDialog({ unmountOnHide: false })],
]

/** Mounts the overlay open from the start, as the docs demos do, and records each focus call on its trigger with whether it moved focus there. */
async function mountOpen(render: (open: boolean) => ReturnType<typeof h>, slot: string) {
  document.body.innerHTML = '<div id="app"></div>'
  const shown = ref(true)
  app = createApp({ render: () => render(shown.value) })
  app.mount('#app')
  await settle()
  const trigger = document.querySelector<HTMLElement>(`[data-slot="${slot}-trigger"]`)!
  const focus = trigger.focus.bind(trigger)
  // A focus call on the element that already has focus changes nothing, its ring included.
  const moves: (FocusOptions | undefined)[] = []
  const spy = vi.spyOn(trigger, 'focus').mockImplementation((options) => {
    if (document.activeElement !== trigger) moves.push(options)
    focus(options)
  })
  return { shown, focus: spy, moves, trigger }
}

/** A press outside the overlay, which Reka reads as an interaction outside it. */
const pressOutside = (button: number) => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button }))

// Focused by script from the page, the open overlay wears :focus-visible in Chrome and Safari whatever opened it, and the trigger would inherit it when focus comes back.
describe.each(OVERLAYS)('a %s open from the start, closing', (_, slot, render) => {
  it('after a pointer, moves focus to its trigger once, without a focus ring', async () => {
    const { shown, moves, trigger } = await mountOpen(render, slot)
    dispatchEvent(new Event('pointerdown'))
    shown.value = false
    await settle()
    expect(moves).toEqual([{ preventScroll: true, focusVisible: false }])
    expect(document.activeElement).toBe(trigger)
  })

  it('after a key, gives focus back to its trigger as the browser decides, which shows the ring', async () => {
    const { shown, focus } = await mountOpen(render, slot)
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    shown.value = false
    await settle()
    expect(focus).toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalledWith(expect.objectContaining({ focusVisible: false }))
  })
})

// Where Reka leaves focus where an outside press took it, so does the overlay.
describe.each([
  ['a modal dropdown menu, right-clicked outside', 'dropdown-menu', dropdown, 2],
  ['a non-modal dialog, clicked outside', 'dialog', OVERLAYS.find(([name]) => name === 'non-modal dialog')![2], 0],
  ['a non-modal scrolling dialog, clicked outside', 'dialog', OVERLAYS.find(([name]) => name === 'non-modal scrolling dialog')![2], 0],
  ['a non-modal sheet, clicked outside', 'sheet', OVERLAYS.find(([name]) => name === 'non-modal sheet')![2], 0],
  ['a non-modal drawer, clicked outside', 'drawer', OVERLAYS.find(([name]) => name === 'non-modal drawer')![2], 0],
] as const)('%s', (_, slot, render, button) => {
  it('closes without focusing its trigger', async () => {
    const { shown, moves } = await mountOpen(render, slot)
    pressOutside(button)
    shown.value = false
    await settle()
    expect(moves).toEqual([])
  })
})

describe('a dropdown menu open from the start, closing after a pointer', () => {
  it('gives focus back a task later, as Reka does', async () => {
    const { shown, moves } = await mountOpen(dropdown, 'dropdown-menu')
    dispatchEvent(new Event('pointerdown'))
    shown.value = false
    for (let i = 0; i < 3; i++) await nextTick()
    expect(moves).toEqual([])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(moves).toEqual([{ preventScroll: true, focusVisible: false }])
  })
})

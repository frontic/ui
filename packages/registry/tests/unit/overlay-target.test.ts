// @vitest-environment happy-dom
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '../../ui/alert-dialog'
import { Combobox, ComboboxList } from '../../ui/combobox'
import { ContextMenu, ContextMenuContent, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '../../ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogScrollContent, DialogTitle } from '../../ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '../../ui/drawer'
import { FilterGroup } from '../../ui/filter'
import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Select, SelectContent, SelectTrigger } from '../../ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../../ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

/** Mounts `render` with the target provided, and returns where `slot`'s element landed. */
async function landing(render: () => unknown, slot: string, target?: string, open?: () => void) {
  document.body.innerHTML = '<div id="island"></div><div id="app"></div>'
  const app = createApp(defineComponent({ setup: () => () => (target ? h(ConfigProvider, { teleportTo: target }, render) : render()) }))
  app.mount('#app')
  await settle()
  if (open) {
    open()
    await settle()
  }
  const element = document.querySelector(`[data-slot="${slot}"]`)
  const where = !element ? 'missing' : document.getElementById('island')!.contains(element) ? 'island' : document.getElementById('app')!.contains(element) ? 'not teleported' : 'body'
  app.unmount()
  return where
}

const cases: [string, string, () => unknown, (() => void)?][] = [
  ['dialog', 'dialog-content', () => h(Dialog, { open: true }, () => h(DialogContent, null, () => [h(DialogTitle, null, () => 't'), h(DialogDescription, null, () => 'd')]))],
  ['dialog scroll content', 'dialog-content', () => h(Dialog, { open: true }, () => h(DialogScrollContent, null, () => [h(DialogTitle, null, () => 't'), h(DialogDescription, null, () => 'd')]))],
  [
    'alert-dialog',
    'alert-dialog-content',
    () => h(AlertDialog, { open: true }, () => h(AlertDialogContent, null, () => [h(AlertDialogTitle, null, () => 't'), h(AlertDialogDescription, null, () => 'd')])),
  ],
  ['sheet', 'sheet-content', () => h(Sheet, { open: true }, () => h(SheetContent, null, () => [h(SheetTitle, null, () => 't'), h(SheetDescription, null, () => 'd')]))],
  ['drawer', 'drawer-content', () => h(Drawer, { open: true }, () => h(DrawerContent, null, () => [h(DrawerTitle, null, () => 't'), h(DrawerDescription, null, () => 'd')]))],
  ['popover', 'popover-content', () => h(Popover, { open: true }, () => [h(PopoverTrigger, null, () => 'open'), h(PopoverContent, null, () => 'x')])],
  ['hover-card', 'hover-card-content', () => h(HoverCard, { open: true }, () => [h(HoverCardTrigger, null, () => 'open'), h(HoverCardContent, null, () => 'x')])],
  ['tooltip', 'tooltip-content', () => h(TooltipProvider, null, () => h(Tooltip, { open: true }, () => [h(TooltipTrigger, null, () => 'open'), h(TooltipContent, null, () => 'x')]))],
  ['dropdown-menu', 'dropdown-menu-content', () => h(DropdownMenu, { open: true }, () => [h(DropdownMenuTrigger, null, () => 'open'), h(DropdownMenuContent, null, () => 'x')])],
  [
    'context-menu',
    'context-menu-content',
    () => h(ContextMenu, null, () => [h(ContextMenuTrigger, null, () => 'area'), h(ContextMenuContent, null, () => 'x')]),
    () => document.querySelector('[data-slot="context-menu-trigger"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 4, clientY: 4 })),
  ],
  [
    'dropdown-menu portal',
    'dropdown-menu-sub-content',
    () =>
      h(DropdownMenu, { open: true }, () => [
        h(DropdownMenuTrigger, null, () => 'open'),
        h(DropdownMenuContent, null, () =>
          h(DropdownMenuSub, { open: true }, () => [h(DropdownMenuSubTrigger, null, () => 'more'), h(DropdownMenuPortal, null, () => h(DropdownMenuSubContent, null, () => 'x'))]),
        ),
      ]),
  ],
  [
    'context-menu portal',
    'context-menu-sub-content',
    () =>
      h(ContextMenu, null, () => [
        h(ContextMenuTrigger, null, () => 'area'),
        h(ContextMenuContent, null, () =>
          h(ContextMenuSub, { open: true }, () => [h(ContextMenuSubTrigger, null, () => 'more'), h(ContextMenuPortal, null, () => h(ContextMenuSubContent, null, () => 'x'))]),
        ),
      ]),
    () => document.querySelector('[data-slot="context-menu-trigger"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 4, clientY: 4 })),
  ],
  ['select', 'select-content', () => h(Select, { open: true }, () => [h(SelectTrigger, null, () => 'open'), h(SelectContent, { position: 'popper' }, () => 'x')])],
  ['combobox', 'combobox-content', () => h(Combobox, { open: true }, () => h(ComboboxList, null, () => 'x'))],
  ['filter group', 'popover-content', () => h(FilterGroup, { label: 'Brand' }, () => 'x'), () => (document.querySelector('#app button') as HTMLElement).click()],
]

afterEach(() => {
  document.body.innerHTML = ''
})

describe("every overlay teleports to the ConfigProvider's teleportTo", () => {
  for (const [name, slot, render, open] of cases) {
    it(`${name}: the target when one is provided, body when none is`, async () => {
      expect(await landing(render, slot, '#island', open)).toBe('island')
      expect(await landing(render, slot, undefined, open)).toBe('body')
    })
  }

  const dialogs = [
    ['dialog', (props: Record<string, unknown>) => h(Dialog, props, () => h(DialogContent, null, () => [h(DialogTitle, null, () => 't'), h(DialogDescription, null, () => 'd')]))],
    [
      'alert-dialog',
      (props: Record<string, unknown>) => h(AlertDialog, props, () => h(AlertDialogContent, null, () => [h(AlertDialogTitle, null, () => 't'), h(AlertDialogDescription, null, () => 'd')])),
    ],
  ] as const

  it.each(dialogs)('%s content sits in a viewport-wide @container frame, a sibling of its overlay', async (slot, render) => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => render({ open: true }) }))
    app.mount('#app')
    await settle()
    const frame = document.querySelector(`[data-slot="${slot}-content"]`)!.parentElement!
    expect(frame.dataset.slot).toBe(`${slot}-frame`)
    expect(frame.classList.contains('@container')).toBe(true)
    expect(frame.parentElement!.querySelector(`:scope > [data-slot="${slot}-overlay"]`)).not.toBeNull()
    app.unmount()
  })

  it('a non-modal dialog renders its content', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => dialogs[0][1]({ open: true, modal: false }) }))
    app.mount('#app')
    await settle()
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull()
    expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    app.unmount()
  })

  it('a click on the overlay closes the dialog, a click in its content does not', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const open = shallowRef(true)
    const app = createApp(defineComponent({ setup: () => () => dialogs[0][1]({ open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }) }))
    app.mount('#app')
    await settle()
    const press = (el: Element) => {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    }
    press(document.querySelector('[data-slot="dialog-content"]')!)
    await settle()
    expect(open.value).toBe(true)
    press(document.querySelector('[data-slot="dialog-overlay"]')!)
    await settle()
    expect(open.value).toBe(false)
    app.unmount()
  })

  it('takes an element ref as the target too, and follows it once it is set', async () => {
    document.body.innerHTML = '<div id="island"></div><div id="app"></div>'
    const outlet = shallowRef<HTMLElement>()
    const app = createApp(
      defineComponent({
        setup: () => () => h(ConfigProvider, { teleportTo: outlet.value }, () => h(Popover, { open: true }, () => [h(PopoverTrigger, null, () => 'open'), h(PopoverContent, null, () => 'x')])),
      }),
    )
    outlet.value = document.getElementById('island')!
    app.mount('#app')
    await settle()
    expect(document.getElementById('island')!.querySelector('[data-slot="popover-content"]')).not.toBeNull()
    app.unmount()
  })
})

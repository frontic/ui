// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type Component } from 'vue'
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from '../../ui/alert-dialog'
import { Dialog, DialogContent, DialogScrollContent, DialogTitle } from '../../ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '../../ui/sheet'

let app: ReturnType<typeof createApp> | undefined
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

async function mount(Root: Component, Content: Component, Title: Component, rootProps: object, contentProps: object, open = ref(true)) {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Root, { open: open.value, ...rootProps }, () => h(Content, contentProps, () => h(Title, null, () => 'Edit address'))) })
  app.mount('#app')
  await settle()
  return open
}

const PARTS: [string, Component, Component, Component][] = [
  ['dialog', Dialog, DialogContent, DialogTitle],
  ['scrolling dialog', Dialog, DialogScrollContent, DialogTitle],
  ['sheet', Sheet, SheetContent, SheetTitle],
  ['alert-dialog', AlertDialog, AlertDialogContent, AlertDialogTitle],
]

describe.each(PARTS)('a %s without a transition', (_, Root, Content, Title) => {
  it('renders open as it always has', async () => {
    await mount(Root, Content, Title, {}, {})
    expect(document.body.innerHTML).toMatchSnapshot()
  })

  it('renders closed and kept mounted as it always has', async () => {
    await mount(Root, Content, Title, { unmountOnHide: false }, {}, ref(false))
    expect(document.body.innerHTML).toMatchSnapshot()
  })
})

describe.each(['top', 'start'] as const)('a sheet from the %s without a transition', (side) => {
  it('renders open as it always has', async () => {
    await mount(Sheet, SheetContent, SheetTitle, {}, { side })
    expect(document.body.innerHTML).toMatchSnapshot()
  })
})

// The element each part animates: the frame around the content, or the sheet itself.
const ANIMATED: [string, Component, Component, Component, string][] = [
  ['dialog', Dialog, DialogContent, DialogTitle, 'dialog-frame'],
  ['scrolling dialog', Dialog, DialogScrollContent, DialogTitle, 'dialog-frame'],
  ['sheet', Sheet, SheetContent, SheetTitle, 'sheet-content'],
  ['alert-dialog', AlertDialog, AlertDialogContent, AlertDialogTitle, 'alert-dialog-frame'],
]

describe.each(ANIMATED)('a %s with a transition', (_, Root, Content, Title, slot) => {
  it('hands each enter hook the element it animates once, wearing none of its own animation', async () => {
    const calls: [string, Element][] = []
    const hook = (name: string) => (el: Element) => calls.push([name, el])
    await mount(
      Root,
      Content,
      Title,
      {},
      {
        transition: { appear: true, onBeforeEnter: hook('before'), onEnter: (el: Element, done: () => void) => (calls.push(['enter', el]), done()), onAfterEnter: hook('after') },
      },
    )
    const animated = document.querySelector(`[data-slot="${slot}"]`)!
    expect(calls).toEqual([
      ['before', animated],
      ['enter', animated],
      ['after', animated],
    ])
    expect(animated.className.split(' ').filter((cls) => /animate-|fade-|zoom-|slide-|duration-/.test(cls))).toEqual([])
    expect(animated.hasAttribute('transition')).toBe(false)
  })

  it('runs an enter hook that takes no done once, and enters again after it has left', async () => {
    const entered: Element[] = []
    const open = await mount(Root, Content, Title, {}, { transition: { appear: true, css: false, onEnter: (el: Element) => entered.push(el) } })
    open.value = false
    await settle()
    open.value = true
    await settle()
    expect(entered.length).toBe(2)
    expect(entered[1]).toBe(document.querySelector(`[data-slot="${slot}"]`))
  })

  it('stays until its leave is done, then runs the caller’s own afterLeave', async () => {
    const leave = { finish: () => {} }
    const afterLeave: Element[] = []
    const open = await mount(Root, Content, Title, {}, { transition: { onLeave: (_: Element, done: () => void) => (leave.finish = done), onAfterLeave: (el: Element) => afterLeave.push(el) } })
    const animated = document.querySelector(`[data-slot="${slot}"]`)!
    open.value = false
    await settle()
    expect([animated.isConnected, afterLeave]).toEqual([true, []])
    leave.finish()
    await settle()
    expect([animated.isConnected, afterLeave]).toEqual([false, [animated]])
  })
})

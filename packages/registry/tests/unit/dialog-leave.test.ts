// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog'
import { Dialog, DialogContent, DialogScrollContent, DialogTrigger } from '../../ui/dialog'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

async function settle() {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const FRAMES = [
  ['DialogContent', Dialog, DialogContent, 'dialog-frame', 'dialog-content'],
  ['DialogScrollContent', Dialog, DialogScrollContent, 'dialog-frame', 'dialog-content'],
  ['AlertDialogContent', AlertDialog, AlertDialogContent, 'alert-dialog-frame', 'alert-dialog-content'],
] as const

let unmount = () => {}
afterEach(() => unmount())

/** A dialog whose frame animates as `data-open:animate-in data-closed:animate-out` would; happy-dom reads the name from this stylesheet. */
function mountDialog(Root: (typeof FRAMES)[number][1], Content: (typeof FRAMES)[number][2], rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}) {
  const open = ref(true)
  document.head.innerHTML = '<style>[data-state=open][data-slot$=dialog-frame] { animation-name: enter } [data-state=closed][data-slot$=dialog-frame] { animation-name: exit }</style>'
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(
    defineComponent({
      setup: () => () => h(Root, { open: open.value, ...rootProps }, () => h(Content, contentProps, () => 'body')),
    }),
  )
  app.mount('#app')
  unmount = () => app.unmount()
  return open
}

const query = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
const end = (el: HTMLElement | null, animationName = 'exit') => el!.dispatchEvent(new AnimationEvent('animationend', { animationName }))

describe.each(FRAMES)('%s on close', (_, Root, Content, frameSlot, contentSlot) => {
  it('keeps its frame and content through the exit animation, then removes both', async () => {
    const open = mountDialog(Root, Content)
    await settle()
    expect(query(contentSlot)?.getAttribute('data-state')).toBe('open')

    open.value = false
    await settle()
    expect(query(frameSlot)).not.toBeNull()
    expect(query(contentSlot)?.getAttribute('data-state')).toBe('closed')

    end(query(frameSlot))
    await settle()
    expect(query(contentSlot)).toBeNull()
    expect(query(frameSlot)).toBeNull()
  })

  it('reopened during its exit, keeps one open content in its frame', async () => {
    const open = mountDialog(Root, Content)
    await settle()
    open.value = false
    await settle()
    open.value = true
    await settle()
    expect(document.querySelectorAll(`[data-slot="${frameSlot}"]`)).toHaveLength(1)
    expect(query(contentSlot)?.getAttribute('data-state')).toBe('open')
  })

  it('toggled rapidly, leaves once the last close has played its exit', async () => {
    const open = mountDialog(Root, Content)
    await settle()
    for (const value of [false, true, false]) {
      open.value = value
      await nextTick()
    }
    await settle()
    expect(query(contentSlot)?.getAttribute('data-state')).toBe('closed')
    end(query(frameSlot))
    await settle()
    expect(query(frameSlot)).toBeNull()
  })

  it('with unmountOnHide false, keeps its hidden content and leaves its frame inert', async () => {
    const open = mountDialog(Root, Content, { unmountOnHide: false })
    await settle()
    open.value = false
    await settle()
    end(query(frameSlot))
    await settle()
    expect(query(contentSlot)).not.toBeNull()
    const frame = query(frameSlot)!
    expect(frame.style.display).toBe('none')
    expect(frame.className).toContain('pointer-events-none')
    expect(frame.className).not.toContain('pointer-events-auto')
  })
})

describe.each(FRAMES.filter(([name]) => name !== 'DialogScrollContent'))('%s with forceMount', (_, Root, Content, frameSlot) => {
  it('keeps its frame while closed', async () => {
    const open = mountDialog(Root, Content, {}, { forceMount: true })
    open.value = false
    await settle()
    expect(query(frameSlot)).not.toBeNull()
  })
})

describe('a Dialog’s inset', () => {
  it('steps its sides with its vertical inset, so the content pads the same all round at every width', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const base = trees['dialog-content']!.base as Record<string, unknown>
    expect(base.extends).toContain('surface-inset')
    expect(base).toMatchObject({ paddingX: '{spacing.6}', '@md': { paddingX: '{spacing.8}' } })
  })
})

describe('a Dialog on Presence', () => {
  it('traps focus while open and returns it to the trigger', async () => {
    document.head.innerHTML = '<style>[data-state=open][data-slot$=dialog-frame] { animation-name: enter } [data-state=closed][data-slot$=dialog-frame] { animation-name: exit }</style>'
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp({ render: () => h(Dialog, null, () => [h(DialogTrigger, null, () => 'Open'), h(DialogContent, null, () => h('button', { id: 'inside' }, 'Inside'))]) })
    app.mount('#app')
    unmount = () => app.unmount()
    const trigger = document.querySelector<HTMLElement>('[data-slot="dialog-trigger"]') ?? document.querySelector<HTMLElement>('button')!
    trigger.focus()
    trigger.click()
    await settle()
    const content = query('dialog-content')!
    expect(content.contains(document.activeElement)).toBe(true)
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    end(query('dialog-frame'))
    await settle()
    expect(query('dialog-frame')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})

// @vitest-environment happy-dom
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import * as sheet from '../../ui/sheet'
import Demo from '../../ui/sheet/sheet.example.vue'

const { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } = sheet
let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  for (let i = 0; i < 4; i++) await nextTick()
}
afterEach(() => app?.unmount())
const $ = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!

describe('a Sheet', () => {
  it('scrolls its body between a header and footer that stay in view', async () => {
    const SheetBody = (sheet as Record<string, unknown>).SheetBody as never
    expect(SheetBody).toBeDefined()
    await mount(() =>
      h(Sheet, { defaultOpen: true }, () =>
        h(SheetContent, null, () => [h(SheetHeader, null, () => h(SheetTitle, null, () => 'Your cart')), h(SheetBody, null, () => 'Items'), h(SheetFooter, null, () => 'Checkout')]),
      ),
    )
    const body = $('sheet-body')
    expect(body.classList.contains('fui-sheet-body')).toBe(true)
    expect(body.classList.contains('overflow-y-auto')).toBe(true)
    expect(body.previousElementSibling).toBe($('sheet-header'))
    expect(body.nextElementSibling).toBe($('sheet-footer'))
  })

  it('puts its close button on the end side, named for screen readers', async () => {
    await mount(() => h(Sheet, { defaultOpen: true }, () => h(SheetContent, { closeLabel: 'Close cart' }, () => h(SheetTitle, null, () => 'Your cart'))))
    const close = $('sheet-close')
    expect(close.classList.contains('inset-e-4')).toBe(true)
    expect(close.className).not.toMatch(/\bright-4\b/)
    expect(close.textContent).toContain('Close cart')
  })

  it('slides in from the side it is given', async () => {
    await mount(() => h(Sheet, { defaultOpen: true }, () => h(SheetContent, { side: 'left' }, () => h(SheetTitle, null, () => 'Menu'))))
    expect($('sheet-content').classList.contains('fui-sheet-content-left')).toBe(true)
    expect($('sheet-content').dataset.side).toBe('left')
  })

  it('slides in from the start or end of the reading direction: its edge, border and motion are logical, so a right-to-left page mirrors it', async () => {
    for (const side of ['start', 'end'] as const) {
      await mount(() => h(Sheet, { defaultOpen: true }, () => h(SheetContent, { side }, () => h(SheetTitle, null, () => 'Cart'))))
      const content = $('sheet-content')
      const s = side === 'start' ? 's' : 'e'
      expect([
        content.dataset.side,
        content.classList.contains(`fui-sheet-content-${side}`),
        content.classList.contains(`inset-${s}-0`),
        content.classList.contains(`data-open:slide-in-from-${side}-10`),
      ]).toEqual([side, true, true, true])
      expect(content.className).not.toMatch(/\b(left|right)-0\b/)
      app?.unmount()
    }
  })

  it('opens from the end by default', async () => {
    await mount(() => h(Sheet, { defaultOpen: true }, () => h(SheetContent, null, () => h(SheetTitle, null, () => 'Cart'))))
    expect($('sheet-content').dataset.side).toBe('end')
  })

  it('keeps a left or right side on that screen edge in either direction', async () => {
    for (const dir of ['ltr', 'rtl'] as const)
      for (const side of ['left', 'right'] as const) {
        await mount(() => h(ConfigProvider, { dir }, () => h(Sheet, { defaultOpen: true }, () => h(SheetContent, { side }, () => h(SheetTitle, null, () => 'Cart')))))
        expect([dir, $('sheet-content').dataset.side, $('sheet-content').classList.contains(`fui-sheet-content-${side}`)]).toEqual([dir, side, true])
        app?.unmount()
      }
  })

  it('is opened from a start or end side by every item, never a fixed left or right that a right-to-left page would leave behind', () => {
    const root = join(import.meta.dirname, '../..')
    const files = globSync(['ui/**/*.vue', 'sections/**/*.vue', 'templates/**/*.vue', 'blocks/**/*.vue'], { cwd: root, exclude: (file) => file.startsWith('ui/sheet/') })
    const fixed = files.flatMap((file) => [...readFileSync(join(root, file), 'utf8').matchAll(/<SheetContent\b[^>]*\sside="(left|right)"/g)].map((m) => `${file}: side="${m[1]}"`))
    expect(fixed).toEqual([])
  })

  it('demo fills a cart that scrolls under its checkout footer', async () => {
    await mount(() => h(Demo))
    expect($('sheet-body').textContent).toContain('Frost Escape Parka')
    expect($('sheet-footer').textContent).toContain('Checkout')
  })
})

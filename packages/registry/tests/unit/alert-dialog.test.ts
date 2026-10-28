// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
const mount = async (contentProps: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(AlertDialog, { open: true }, () => h(AlertDialogContent, contentProps, () => [h(AlertDialogHeader), h(AlertDialogFooter)])) })
  app.mount('#app')
  for (let i = 0; i < 3; i++) await nextTick()
}
const $ = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!
// A fresh page has seen no key; the dialog reads the last input from the window, which outlives a test.
beforeEach(() => dispatchEvent(new Event('pointerdown')))
afterEach(() => app?.unmount())

describe('an AlertDialog’s widths', () => {
  it.each(['md', 'sm'])('come from the content recipe’s %s size, not from width utilities', async (size) => {
    await mount({ size })
    const classes = [...$('alert-dialog-content').classList]
    expect(classes).toContain(`fui-alert-dialog-content-${size}`)
    expect(classes.filter((c) => /max-w-/.test(c))).toEqual([])
  })
})

describe('an AlertDialog’s header and footer', () => {
  it('wear recipes of their own for their spacing', async () => {
    await mount()
    expect($('alert-dialog-header').classList.contains('fui-alert-dialog-header')).toBe(true)
    expect($('alert-dialog-footer').classList.contains('fui-alert-dialog-footer')).toBe(true)
  })
})

describe('an AlertDialog’s inset', () => {
  it('steps its sides with its vertical inset, so the content pads the same all round at every width', () => {
    const { flat, trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const base = trees['alert-dialog-content']!.base as Record<string, unknown>
    expect(base.extends).toContain('surface-inset')
    expect(base).toMatchObject({ paddingX: '{spacing.6}', '@md': { paddingX: '{spacing.8}' } })
    expect(flat['surface-inset']).toEqual({ paddingY: '{spacing.6}', '@md': { paddingY: '{spacing.8}' } })
  })
})

describe('an AlertDialog opening', () => {
  it('focuses the dialog itself, which names its title and description, so no button wears a focus ring until the keyboard moves on', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () =>
        h(AlertDialog, { open: true }, () =>
          h(AlertDialogContent, null, () => [
            h(AlertDialogHeader, null, () => [h(AlertDialogTitle, null, () => 'Delete this address?'), h(AlertDialogDescription, null, () => 'It leaves your address book.')]),
            h(AlertDialogFooter, null, () => [h(AlertDialogCancel, null, () => 'Cancel')]),
          ]),
        ),
    })
    app.mount('#app')
    for (let i = 0; i < 3; i++) await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const content = document.querySelector<HTMLElement>('[role="alertdialog"]')!
    expect(document.activeElement).toBe(content)
    expect(document.getElementById(content.getAttribute('aria-labelledby')!)!.textContent).toBe('Delete this address?')
    expect(document.getElementById(content.getAttribute('aria-describedby')!)!.textContent).toBe('It leaves your address book.')
  })
})

describe('an AlertDialog opened by its trigger', () => {
  const settle = async () => {
    for (let i = 0; i < 3; i++) await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    for (let i = 0; i < 3; i++) await nextTick()
  }
  const open = async (input: Event) => {
    document.body.innerHTML = '<div id="app"></div>'
    const shown = ref(false)
    app = createApp({
      render: () =>
        h(AlertDialog, { open: shown.value }, () => [
          h(AlertDialogTrigger, null, () => 'Delete address'),
          h(AlertDialogContent, null, () => [
            h(AlertDialogHeader, null, () => [h(AlertDialogTitle, null, () => 'Delete this address?'), h(AlertDialogDescription, null, () => 'It leaves your address book.')]),
            h(AlertDialogFooter, null, () => [h(AlertDialogCancel, null, () => 'Cancel')]),
          ]),
        ]),
    })
    app.mount('#app')
    await settle()
    const trigger = $('alert-dialog-trigger') as HTMLElement
    trigger.focus()
    dispatchEvent(input)
    shown.value = true
    await settle()
  }

  it('from a pointer, focuses the dialog itself, so no button wears a focus ring', async () => {
    await open(new Event('pointerdown'))
    expect(document.activeElement).toBe(document.querySelector('[role="alertdialog"]'))
  })

  it('from the keyboard, focuses Cancel, which shows the ring', async () => {
    await open(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(document.activeElement).toBe($('alert-dialog-cancel'))
  })
})

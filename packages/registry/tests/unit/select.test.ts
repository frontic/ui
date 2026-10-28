// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import Demo from '../../ui/select/select.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (contentProps: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({
    render: () =>
      h(Select, { defaultOpen: true, defaultValue: 'm' }, () => [
        h(SelectTrigger, null, () => h(SelectValue, { placeholder: 'Size' })),
        h(SelectContent, contentProps, () => [h(SelectItem, { value: 's' }, () => 'S'), h(SelectItem, { value: 'm' }, () => 'M')]),
      ]),
  })
  app.mount('#app')
  for (let i = 0; i < 4; i++) await nextTick()
}
afterEach(() => app?.unmount())
const content = () => document.querySelector<HTMLElement>('[data-slot="select-content"]')!

describe('a Select', () => {
  it('opens its list below the trigger at the trigger’s width, as a combobox does', async () => {
    await mount()
    expect(content().getAttribute('data-align-trigger')).toBe('false')
    expect(content().classList.contains('fui-select-content-popper')).toBe(true)
    expect(content().className).not.toMatch(/translate-[xy]-1/)
  })

  it('still lands on the selected option when asked to', async () => {
    await mount({ position: 'item-aligned' })
    expect(content().getAttribute('data-align-trigger')).toBe('true')
    expect(content().classList.contains('fui-select-content-popper')).toBe(false)
    expect(content().classList.contains('fui-select-content-item-aligned')).toBe(true)
  })

  it('puts the check on the end side, through its recipe', async () => {
    await mount()
    const slot = document.querySelector<HTMLElement>('[data-slot="select-item-indicator"]')!
    expect(slot.classList.contains('inset-e-2')).toBe(true)
    expect(slot.className).not.toMatch(/\b(?:right|left)-2\b|\bsize-4\b/)
    expect(slot.classList.contains('fui-select-item-indicator')).toBe(true)
  })

  it('takes its name, description and disabled state from the Field', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () =>
        h(Field, { disabled: true }, () => [
          h(FieldLabel, null, () => 'Jacket size'),
          h(Select, null, () => [h(SelectTrigger, null, () => h(SelectValue, { placeholder: 'Size' })), h(SelectContent, null, () => h(SelectItem, { value: 's' }, () => 'S'))]),
          h(FieldDescription, null, () => 'Runs small.'),
        ]),
    })
    app.mount('#app')
    for (let i = 0; i < 4; i++) await nextTick()
    const trigger = document.querySelector<HTMLButtonElement>('[data-slot="select-trigger"]')!
    expect(document.querySelector('label')!.getAttribute('for')).toBe(trigger.id)
    expect(document.getElementById(trigger.getAttribute('aria-describedby')!)?.textContent).toBe('Runs small.')
    expect(trigger.disabled).toBe(true)
  })

  it('demo names its trigger through the Field and marks a sold-out size', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Demo, { defaultOpen: true }) })
    app.mount('#app')
    for (let i = 0; i < 4; i++) await nextTick()
    const trigger = document.querySelector<HTMLButtonElement>('[data-slot="select-trigger"]')!
    expect(document.querySelector('label')!.getAttribute('for')).toBe(trigger.id)
    expect(document.querySelector('[data-slot="select-item"][data-disabled]')!.textContent).toBe('XL')
  })

  it('groups the example’s sizes into in stock and sold out, with a separator between and only the sold-out ones disabled', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Demo, { defaultOpen: true }) })
    app.mount('#app')
    for (let i = 0; i < 4; i++) await nextTick()
    const groups = [...document.querySelectorAll('[data-slot="select-group"]')].map((group) => ({
      label: group.querySelector('[data-slot="select-label"]')?.textContent?.trim(),
      sizes: [...group.querySelectorAll('[data-slot="select-item"]')].map((item) => `${item.textContent?.trim()}${item.hasAttribute('data-disabled') ? ' disabled' : ''}`),
    }))
    expect(groups).toEqual([
      { label: 'In stock', sizes: ['S', 'M', 'L'] },
      { label: 'Sold out', sizes: ['XL disabled'] },
    ])
    expect(document.querySelectorAll('[data-slot="select-content"] [data-slot="select-separator"]')).toHaveLength(1)
  })
})

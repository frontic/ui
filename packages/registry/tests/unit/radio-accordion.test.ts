// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldLabel } from '../../ui/field'
import { RadioAccordion, RadioAccordionContent, RadioAccordionItem, RadioAccordionTrigger } from '../../ui/radio-accordion'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const triggers = () => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="radio-accordion-trigger"]')]
const panels = () => [...document.querySelectorAll('[data-slot="radio-accordion-item"]')].map((item) => (item.querySelector('[data-slot="radio-accordion-content"]') ? 'open' : 'closed'))
afterEach(() => app?.unmount())

const option = (value: string, extra: Record<string, unknown> = {}) =>
  h(RadioAccordionItem, { value, ...extra }, () => [h(RadioAccordionTrigger, null, () => value), h(RadioAccordionContent, null, () => h('input', { 'aria-label': `${value} detail` }))])

describe('a RadioAccordion', () => {
  it('reveals the picked option, with its value set once on the item', async () => {
    const picked = ref('card')
    await mount(() => h(RadioAccordion, { modelValue: picked.value, 'onUpdate:modelValue': (next: string) => (picked.value = next) }, () => [option('card'), option('paypal')]))
    expect(panels()).toEqual(['open', 'closed'])
    expect(triggers()[0]!.getAttribute('aria-checked')).toBe('true')

    triggers()[1]!.click()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()
    expect(picked.value).toBe('paypal')
    expect(triggers()[1]!.getAttribute('aria-checked')).toBe('true')
    expect(panels()).toEqual(['closed', 'open'])
  })

  it('keeps the details outside the radio button, so they can hold inputs', async () => {
    await mount(() => h(RadioAccordion, { defaultValue: 'card' }, () => option('card')))
    expect($('input[aria-label="card detail"]').closest('[role="radio"]')).toBeNull()
  })

  it('keeps a disabled option from being picked', async () => {
    await mount(() => h(RadioAccordion, { defaultValue: 'card' }, () => [option('card'), option('klarna', { disabled: true })]))
    expect(triggers()[1]!.disabled).toBe(true)
    expect($('[data-slot="radio-accordion-item"]:nth-child(2)').hasAttribute('data-disabled')).toBe(true)
  })

  it('opens and closes its details through the library collapsible', async () => {
    await mount(() => h(RadioAccordion, { defaultValue: 'card' }, () => option('card')))
    const content = $('[data-slot="radio-accordion-item"] [data-slot="collapsible-content"]')
    expect(content.classList.contains('fui-collapsible-content')).toBe(true)
    expect(content.querySelector('[data-slot="radio-accordion-content"]')!.classList.contains('fui-radio-accordion-content')).toBe(true)
  })

  it('removes closed details unless told to keep them', async () => {
    const group = (keep?: boolean) => () =>
      h(RadioAccordion, { defaultValue: 'paypal' }, () => [
        h(RadioAccordionItem, { value: 'card' }, () => [
          h(RadioAccordionTrigger, null, () => 'card'),
          h(RadioAccordionContent, keep === undefined ? null : { unmountOnHide: !keep }, () => h('input', { 'aria-label': 'card number' })),
        ]),
        option('paypal'),
      ])
    await mount(group())
    expect(document.querySelector('input[aria-label="card number"]')).toBeNull()
    app!.unmount()
    await mount(group(true))
    expect($('input[aria-label="card number"]').closest('[hidden]')).not.toBeNull()
  })

  it('spaces outline cards apart through its recipe, and keeps rendering when the variant changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const variant = ref<'plain' | 'outline'>('outline')
    await mount(() => h(RadioAccordion, { variant: variant.value }, () => option('card')))
    expect($('[data-slot="radio-accordion"]').classList.contains('fui-radio-accordion-outline')).toBe(true)
    expect($('[data-slot="radio-accordion"]').classList.contains('gap-3')).toBe(false)
    variant.value = 'plain'
    await nextTick()
    expect($('[data-slot="radio-accordion"]').classList.contains('fui-radio-accordion-plain')).toBe(true)
    expect(warn.mock.calls.flat().join('\n')).not.toMatch(/Template ref/)
    warn.mockRestore()
  })

  it('joins the Field around it', async () => {
    await mount(() => h(Field, { name: 'payment' }, () => [h(FieldLabel, { nativeLabel: false }, () => 'Payment'), h(RadioAccordion, null, () => option('card'))]))
    expect($('[role="radiogroup"]').getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
  })
})

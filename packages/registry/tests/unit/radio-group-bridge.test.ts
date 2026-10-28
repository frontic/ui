// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const radios = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
afterEach(() => app?.unmount())

const option = (value: string) => h(Field, { orientation: 'horizontal' }, () => [h(RadioGroupItem, { id: value, value }), h(FieldLabel, { for: value }, () => value)])
const delivery = (props: Record<string, unknown> = {}) => h(RadioGroup, props, () => [option('standard'), option('express')])

describe('a RadioGroup inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'delivery', disabled: true }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Delivery'),
          delivery({ defaultValue: 'standard' }),
          h(FieldDescription, null, () => 'Free over 50.'),
        ]),
      ]),
    )
    const group = $('[role="radiogroup"]')
    expect(group.getAttribute('aria-labelledby')).toBe($('[data-slot="field"] > [data-slot="field-label"]').id)
    expect(group.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(radios().every((radio) => radio.disabled)).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="delivery"]')?.value).toBe('standard')
  })

  it("leaves each option's own label pointing at its radio", async () => {
    await mount(() => h(Field, { name: 'delivery' }, () => [h(FieldLabel, { nativeLabel: false }, () => 'Delivery'), delivery()]))
    expect($('[role="radio"]#express + [data-slot="field-label"]').getAttribute('for')).toBe('express')
  })

  it('focuses the checked option when its label is clicked', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, { nativeLabel: false }, () => 'Delivery'), delivery({ defaultValue: 'express' })]))
    $('[data-slot="field"] > [data-slot="field-label"]').click()
    expect(document.activeElement?.id).toBe('express')
  })

  it('is missing until an option is picked, and hands the pick to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'delivery', required: true }, () => [delivery(), h(FieldError, { match: 'valueMissing' }, () => 'Choose one.')])))
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[role="radiogroup"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Choose one.')
    expect(onFormSubmit).not.toHaveBeenCalled()

    radios()[1]!.click()
    await settle()
    expect($('[role="radiogroup"]').hasAttribute('aria-invalid')).toBe(false)
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ delivery: 'express' }, expect.anything())
  })
})

describe('a RadioGroup alone', () => {
  it('renders without a Field', async () => {
    await mount(() => h(RadioGroup, { defaultValue: 'a' }, () => h(RadioGroupItem, { value: 'a' })))
    expect($('[role="radiogroup"]').hasAttribute('aria-labelledby')).toBe(false)
  })

  it('spaces its items through its recipe', async () => {
    await mount(() => delivery())
    expect($('[data-slot="radio-group"]').classList.contains('fui-radio-group')).toBe(true)
    expect($('[data-slot="radio-group"]').classList.contains('gap-3')).toBe(false)
  })
})

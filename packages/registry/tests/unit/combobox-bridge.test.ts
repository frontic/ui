// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Combobox, ComboboxAnchor, ComboboxTrigger } from '../../ui/combobox'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'

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
afterEach(() => app?.unmount())

const combobox = (props: Record<string, unknown> = {}) => h(Combobox, props, () => h(ComboboxAnchor, null, () => h(ComboboxTrigger, null, () => 'Country')))

describe('a Combobox inside a Field', () => {
  it('names its trigger with the Field, and takes the Field’s disabled state', async () => {
    await mount(() => h(Field, { name: 'country', disabled: true }, () => [h(FieldLabel, null, () => 'Ship to'), combobox(), h(FieldDescription, null, () => 'We ship to the EU.')]))
    const trigger = $('[data-slot="combobox-trigger"]') as HTMLButtonElement
    expect(trigger.id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(trigger.id)
    expect(trigger.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(trigger.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(trigger.disabled).toBe(true)
  })

  it('tells the Field when the value changes', async () => {
    const country = ref<string>()
    await mount(() => h(Field, null, () => combobox({ modelValue: country.value })))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    country.value = 'AT'
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('is missing until a value is picked, and hands the value to the form', async () => {
    const onFormSubmit = vi.fn()
    const country = ref<string>()
    await mount(() =>
      h(Form, { onFormSubmit }, () =>
        h(Field, { name: 'country', required: true }, () => [combobox({ modelValue: country.value }), h(FieldError, { match: 'valueMissing' }, () => 'Choose a country.')]),
      ),
    )
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[data-slot="combobox-trigger"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Choose a country.')

    country.value = 'AT'
    await settle()
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ country: 'AT' }, expect.anything())
  })
})

describe('a required Combobox inside a Field', () => {
  it('is missing until a value is picked, though only the Combobox says required', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'country' }, () => [combobox({ required: true }), h(FieldError, { match: 'valueMissing' }, () => 'Choose a country.')])))
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[data-slot="field-error"]').textContent).toBe('Choose a country.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })
})

describe('a Combobox alone', () => {
  it('renders without a Field', async () => {
    await mount(() => combobox())
    expect($('[data-slot="combobox-trigger"]').hasAttribute('aria-labelledby')).toBe(false)
  })
})

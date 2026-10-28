// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Autocomplete, AutocompleteAnchor, AutocompleteInput } from '../../ui/autocomplete'
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
const input = () => $('[data-slot="autocomplete-input"]') as HTMLInputElement
afterEach(() => app?.unmount())

const autocomplete = (props: Record<string, unknown> = {}) => h(Autocomplete, props, () => h(AutocompleteAnchor, null, () => h(AutocompleteInput)))

describe('an Autocomplete inside a Field', () => {
  it('takes its id, label, description, name and disabled state from the Field', async () => {
    await mount(() => h(Field, { name: 'address', disabled: true }, () => [h(FieldLabel, null, () => 'Delivery address'), autocomplete(), h(FieldDescription, null, () => 'Street and number.')]))
    expect(input().id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(input().id)
    expect(input().getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(input().name).toBe('address')
    expect(input().disabled).toBe(true)
  })

  it('tells the Field when code sets the text', async () => {
    const query = ref('')
    await mount(() => h(Field, null, () => autocomplete({ modelValue: query.value })))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    query.value = 'Hauptstraße 1'
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('is missing until the user types, and hands the text to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'address', required: true }, () => [autocomplete(), h(FieldError, { match: 'valueMissing' }, () => 'Enter an address.')])))
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[data-slot="field-error"]').textContent).toBe('Enter an address.')

    input().value = 'Hauptstraße 1'
    input().dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ address: 'Hauptstraße 1' }, expect.anything())
  })
})

describe('an Autocomplete alone', () => {
  it('renders without a Field', async () => {
    await mount(() => autocomplete())
    expect(input().hasAttribute('aria-describedby')).toBe(false)
  })
})

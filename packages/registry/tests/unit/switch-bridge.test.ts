// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { Switch } from '../../ui/switch'

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

describe('a Switch inside a Field', () => {
  it('takes its id, label, description, name and disabled state from the Field', async () => {
    await mount(() => h('form', [h(Field, { name: 'updates', disabled: true }, () => [h(FieldLabel, null, () => 'Order updates'), h(Switch), h(FieldDescription, null, () => 'By email.')])]))
    const control = $('[data-slot="switch"]') as HTMLButtonElement
    expect(control.id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(control.id)
    expect(control.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(control.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(control.disabled).toBe(true)
    expect(document.querySelector('input[name="updates"]')).not.toBeNull()
  })

  it('tells the Field when the user turns it on', async () => {
    await mount(() => h(Field, null, () => h(Switch)))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    $('[data-slot="switch"]').click()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('tells the Field when code turns it on', async () => {
    const on = ref(false)
    await mount(() => h(Field, null, () => h(Switch, { modelValue: on.value })))
    on.value = true
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('is missing while off when required, and hands its state to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'terms', required: true }, () => [h(Switch), h(FieldError, { match: 'valueMissing' }, () => 'Accept the terms.')])))
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[data-slot="switch"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Accept the terms.')

    $('[data-slot="switch"]').click()
    await settle()
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ terms: true }, expect.anything())
  })
})

describe('an uncontrolled Switch inside a Field', () => {
  it('hands its default state to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'updates', required: true }, () => h(Switch, { defaultValue: true }))))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ updates: true }, expect.anything())
  })
})

describe('a Switch alone', () => {
  it('renders without a Field', async () => {
    await mount(() => h(Switch, { id: 'x' }))
    expect($('[data-slot="switch"]').hasAttribute('aria-labelledby')).toBe(false)
  })
})

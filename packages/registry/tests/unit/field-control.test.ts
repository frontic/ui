// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import FieldDemo from '../../ui/field/field.example.vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import Input from '../../ui/input/Input.vue'
import NativeSelect from '../../ui/native-select/NativeSelect.vue'
import Textarea from '../../ui/textarea/Textarea.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
afterEach(() => app?.unmount())

describe('a native control inside a Field', () => {
  it.each([
    ['input', Input, () => []],
    ['textarea', Textarea, () => []],
    ['native-select', NativeSelect, () => [h('option', { value: 'a' }, 'A')]],
  ] as const)('%s takes its id, name, required and description from the Field', async (slot, Control, children) => {
    await mount(() => h(Field, { name: 'note', required: true }, () => [h(FieldLabel, null, () => 'Note'), h(Control, null, children), h(FieldDescription, null, () => 'Help')]))
    const control = $(`[data-slot="${slot}"]`)
    expect(control.id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(control.id)
    expect(control.getAttribute('name')).toBe('note')
    expect(control.hasAttribute('required')).toBe(true)
    expect(control.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
  })

  it.each([
    ['input', Input, () => []],
    ['textarea', Textarea, () => []],
    ['native-select', NativeSelect, () => [h('option', { value: '' }, 'Pick one'), h('option', { value: 'anna@example.com' }, 'Anna')]],
  ] as const)('%s tells the Field about a value set from code', async (slot, Control, children) => {
    const value = ref('')
    await mount(() => h(Field, null, () => h(Control, { modelValue: value.value, 'onUpdate:modelValue': (next: string) => (value.value = next) }, children)))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    value.value = 'anna@example.com'
    await nextTick()
    await nextTick()
    expect($(`[data-slot="${slot}"]`) as HTMLInputElement).toHaveProperty('value', 'anna@example.com')
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('keeps an id the consumer gives it', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, { for: 'mail' }, () => 'Email'), h(Input, { id: 'mail' })]))
    expect($('[data-slot="input"]').id).toBe('mail')
  })
})

describe('outside a Field', () => {
  it('renders plain elements instead of throwing', async () => {
    await mount(() => [h(FieldLabel, { for: 'a' }, () => 'A'), h(Input, { id: 'a' }), h(FieldDescription, null, () => 'Help')])
    expect($('[data-slot="input"]').tagName).toBe('INPUT')
    expect($('[data-slot="input"]').hasAttribute('aria-describedby')).toBe(false)
    expect($('[data-slot="field-description"]').tagName).toBe('P')
  })
})

describe('the field demo', () => {
  const leave = async (input: HTMLElement) => {
    input.dispatchEvent(new FocusEvent('blur'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
  const type = async (input: HTMLInputElement, value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
  }

  it('stays quiet when an empty email is only tabbed through', async () => {
    await mount(() => h(FieldDemo))
    await leave($('[data-slot="input"]'))
    expect(document.querySelector('[data-slot="field-error"]')).toBeNull()
  })

  it('shows the missing-value message and marks the label invalid once a typed email is cleared and left', async () => {
    await mount(() => h(FieldDemo))
    const input = $('[data-slot="input"]') as HTMLInputElement
    await type(input, 'anna')
    await type(input, '')
    await leave(input)
    const errors = [...document.querySelectorAll('[data-slot="field-error"]')].map((node) => node.textContent?.trim())
    expect(errors).toEqual(['Enter your email for the order confirmation.'])
    expect($('[data-slot="field-label"]').hasAttribute('data-invalid')).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toContain($('[data-slot="field-error"]').id)
  })
})

// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { TagsInput, TagsInputInput } from '../../ui/tags-input'

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
const input = () => $('input:not([data-hidden])') as HTMLInputElement
afterEach(() => app?.unmount())

const tags = (props: Record<string, unknown> = {}) => h(TagsInput, props, () => h(TagsInputInput))
const add = async (text: string) => {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
  input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await settle()
}

describe('a TagsInput inside a Field', () => {
  it('takes its id, label, description and disabled state from the Field', async () => {
    await mount(() => h(Field, { name: 'materials', disabled: true }, () => [h(FieldLabel, null, () => 'Materials'), tags(), h(FieldDescription, null, () => 'Press Enter after each.')]))
    expect(input().id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(input().id)
    expect(input().getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(input().getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(input().disabled).toBe(true)
  })

  it('tells the Field when the user adds a tag', async () => {
    await mount(() => h(Field, null, () => tags()))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    await add('Merino')
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('tells the Field when code sets the tags', async () => {
    const materials = ref<string[]>([])
    await mount(() => h(Field, null, () => tags({ modelValue: materials.value })))
    materials.value = ['Merino']
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('is missing until a tag is added when required, and hands the tags to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'materials', required: true }, () => [tags(), h(FieldError, { match: 'valueMissing' }, () => 'Add at least one material.')])))
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect($('[data-slot="field-error"]').textContent).toBe('Add at least one material.')
    expect(input().getAttribute('aria-invalid')).toBe('true')

    await add('Merino')
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ materials: ['Merino'] }, expect.anything())
  })
})

describe('a TagsInput alone', () => {
  it('renders without a Field', async () => {
    await mount(() => tags())
    expect(input().hasAttribute('aria-labelledby')).toBe(false)
  })
})

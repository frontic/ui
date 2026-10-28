// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, useTemplateRef } from 'vue'
import { useFieldControl } from '../../composables/use-field-control'
import { Field, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group'

let app: ReturnType<typeof createApp> | undefined
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await settle()
}
const submit = async () => {
  $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
afterEach(() => app?.unmount())

const sizes = (props: Record<string, unknown> = {}) =>
  h(Field, { name: 'size', required: props.required as boolean | undefined }, () => [
    h(FieldLabel, null, () => 'Size'),
    h(ToggleGroup, { type: 'single', ...props }, () => ['S', 'M'].map((value) => h(ToggleGroupItem, { value }, () => value))),
  ])

describe('useFieldControl', () => {
  it('joins a control: id, name, disabled, aria and the value the Field validates', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => sizes()))
    expect($('[data-slot="toggle-group"]').getAttribute('aria-labelledby')).toBe($('label').id)
    document.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]')[1]!.click()
    await settle()
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ size: 'M' }, expect.anything())
  })

  it('holds back the submit of a required group left empty and marks it invalid', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => sizes({ required: true })))
    await submit()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect($('[data-slot="toggle-group"]').getAttribute('aria-invalid')).toBe('true')
  })

  it('gives a control that owns an id the Field’s id, and keeps its own focus listeners', async () => {
    const onFocus = vi.fn()
    const Probe = defineComponent({
      props: { id: String, modelValue: String },
      setup(props) {
        const root = useTemplateRef<{ $el: HTMLElement }>('root')
        const { joined } = useFieldControl({ props, forwarded: ref({ onFocus }), root, element: (el) => el?.querySelector('input'), id: () => props.id, focus: 'focus' })
        return () => h('div', { ref: 'root' }, h('input', joined.value))
      },
    })
    await mount(() => h(Field, { name: 'code' }, () => [h(FieldLabel, null, () => 'Code'), h(Probe)]))
    const input = $('input')
    expect(input.id).toBe($('label').getAttribute('for'))
    expect(input.getAttribute('name')).toBe('code')
    input.dispatchEvent(new FocusEvent('focus'))
    expect(onFocus).toHaveBeenCalledOnce()
  })
})

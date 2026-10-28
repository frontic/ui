// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group'

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
const items = () => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]')]
const submit = async () => {
  $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
afterEach(() => app?.unmount())

const sizes = (props: Record<string, unknown> = {}) => h(ToggleGroup, props, () => ['S', 'M', 'L'].map((value) => h(ToggleGroupItem, { value }, () => value)))

describe('a ToggleGroup inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'size', disabled: true }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Size'),
          sizes({ type: 'single', defaultValue: 'M' }),
          h(FieldDescription, null, () => 'Runs small.'),
        ]),
      ]),
    )
    const group = $('[data-slot="toggle-group"]')
    expect(group.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(group.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(items().every((item) => item.disabled)).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="size"]')?.value).toBe('M')
  })

  it('focuses the pressed item when its label is clicked', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, { nativeLabel: false }, () => 'Size'), sizes({ type: 'single', defaultValue: 'L' })]))
    $('[data-slot="field-label"]').click()
    expect(document.activeElement).toBe(items()[2])
  })

  it('is missing until an item is pressed, and hands the pressed items to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'sizes', required: true }, () => [sizes({ type: 'multiple' }), h(FieldError, { match: 'valueMissing' }, () => 'Pick a size.')])))
    await submit()
    expect($('[data-slot="toggle-group"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Pick a size.')
    expect(onFormSubmit).not.toHaveBeenCalled()

    items()[0]!.click()
    items()[2]!.click()
    await settle()
    expect($('[data-slot="toggle-group"]').hasAttribute('aria-invalid')).toBe(false)
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ sizes: ['S', 'L'] }, expect.anything())
  })

  it('reports a value set from code', async () => {
    const onFormSubmit = vi.fn()
    const picked = ref<string[]>([])
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'sizes', required: true }, () => sizes({ type: 'multiple', modelValue: picked.value }))))
    picked.value = ['M']
    await settle()
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ sizes: ['M'] }, expect.anything())
  })
})

describe('a ToggleGroup alone', () => {
  it('renders without a Field', async () => {
    await mount(() => sizes({ type: 'single' }))
    expect($('[data-slot="toggle-group"]').hasAttribute('aria-labelledby')).toBe(false)
  })
})

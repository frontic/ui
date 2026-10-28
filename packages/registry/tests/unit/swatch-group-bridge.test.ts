// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { Swatch } from '../../ui/swatch'
import { SwatchGroup, SwatchGroupItem } from '../../ui/swatch-group'

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
const items = () => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="swatch-group-item"]')]
const submit = async () => {
  $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
afterEach(() => app?.unmount())

const colours = (props: Record<string, unknown> = {}) =>
  h(SwatchGroup, { type: 'single', ...props }, () => [
    h(SwatchGroupItem, { value: 'aubergine', hex: '#3d3347', label: 'Aubergine' }),
    h(SwatchGroupItem, { value: 'dusty-rose', hex: '#b98a87', label: 'Dusty rose' }),
    h(SwatchGroupItem, { value: 'salmon', hex: '#dc967b', label: 'Salmon' }),
  ])

describe('a Swatch', () => {
  it('puts the attributes it is given on its button', async () => {
    await mount(() => [
      h(Swatch, { hex: '#3d3347', 'aria-label': 'Aubergine', id: 'single' }),
      h(SwatchGroup, { type: 'single' }, () => h(SwatchGroupItem, { value: 'salmon', hex: '#dc967b', 'aria-label': 'Salmon' })),
    ])
    expect($('#single').tagName).toBe('BUTTON')
    expect($('[data-slot="swatch"]').getAttribute('aria-label')).toBe('Aubergine')
    expect(items()[0]!.getAttribute('aria-label')).toBe('Salmon')
    expect(document.querySelector('label[aria-label]')).toBeNull()
  })
})

describe('a SwatchGroup inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'colour', disabled: true }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Colour'),
          colours({ defaultValue: 'salmon' }),
          h(FieldDescription, null, () => 'Dyed to order.'),
        ]),
      ]),
    )
    const group = $('[data-slot="swatch-group"]')
    expect(group.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(group.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(items().every((item) => item.disabled)).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="colour"]')?.value).toBe('salmon')
  })

  it('focuses the picked swatch when its label is clicked', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, { nativeLabel: false }, () => 'Colour'), colours({ defaultValue: 'dusty-rose' })]))
    $('[data-slot="field-label"]').click()
    expect(document.activeElement).toBe(items()[1])
  })

  it('is missing until a swatch is picked, and hands the pick to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'colour', required: true }, () => [colours(), h(FieldError, { match: 'valueMissing' }, () => 'Pick a colour.')])))
    await submit()
    expect($('[data-slot="swatch-group"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Pick a colour.')
    expect(onFormSubmit).not.toHaveBeenCalled()

    items()[2]!.click()
    await settle()
    expect($('[data-slot="swatch-group"]').hasAttribute('aria-invalid')).toBe(false)
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ colour: 'salmon' }, expect.anything())
  })

  it('reports a pick set from code', async () => {
    const onFormSubmit = vi.fn()
    const picked = ref<string>()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'colour', required: true }, () => colours({ modelValue: picked.value }))))
    picked.value = 'aubergine'
    await settle()
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ colour: 'aubergine' }, expect.anything())
  })
})

describe('a SwatchGroup alone', () => {
  it('renders without a Field', async () => {
    await mount(() => colours())
    expect($('[data-slot="swatch-group"]').hasAttribute('aria-labelledby')).toBe(false)
  })
})

describe('a controlled SwatchGroup whose parent rejects a deselect', () => {
  it('keeps handing the Field the pick its parent holds', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'colour', required: true }, () => colours({ modelValue: 'salmon', 'onUpdate:modelValue': () => {} }))))
    items()[2]!.click()
    await settle()
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ colour: 'salmon' }, expect.anything())
  })
})

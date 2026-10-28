// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '../../ui/number-field'

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

const stepper = (props: Record<string, unknown> = {}) => h(NumberField, props, () => h(NumberFieldContent, null, () => [h(NumberFieldDecrement), h(NumberFieldInput), h(NumberFieldIncrement)]))

describe('a NumberField inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [h(Field, { name: 'quantity', disabled: true }, () => [h(FieldLabel, null, () => 'Quantity'), stepper({ defaultValue: 1 }), h(FieldDescription, null, () => 'Up to 10.')])]),
    )
    const input = $('[data-slot="number-field-input"]') as HTMLInputElement
    expect(input.id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(input.id)
    expect(input.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(input.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(input.disabled).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="quantity"]')).not.toBeNull()
  })

  it('tells the Field when a step changes the value', async () => {
    await mount(() => h(Field, null, () => stepper()))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    $('[data-slot="number-field-increment"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    $('[data-slot="number-field-increment"]').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('tells the Field when code changes the value', async () => {
    const value = ref<number | undefined>(undefined)
    await mount(() => h(Field, null, () => stepper({ modelValue: value.value })))
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    value.value = 4
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })
})

describe('a NumberField alone', () => {
  it('renders without a Field', async () => {
    await mount(() => stepper({ defaultValue: 2 }))
    expect(($('[data-slot="number-field-input"]') as HTMLInputElement).hasAttribute('aria-labelledby')).toBe(false)
  })
})

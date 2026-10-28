// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { Slider } from '../../ui/slider'

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

describe('a Slider on its own', () => {
  it('names its thumb with its label, and focuses it when the label is clicked', async () => {
    await mount(() => h(Slider, { defaultValue: [40], label: 'Price' }))
    expect($('[role="slider"]').getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    $('[data-slot="field-label"]').click()
    expect(document.activeElement).toBe($('[role="slider"]'))
  })

  it('tells its Field when the user moves the thumb', async () => {
    await mount(() => h(Slider, { defaultValue: [40], label: 'Price' }))
    expect($('[data-slot="slider"]').hasAttribute('data-dirty')).toBe(false)
    $('[role="slider"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()
    expect($('[data-slot="slider"]').hasAttribute('data-dirty')).toBe(true)
  })
})

describe('a Slider inside a Field', () => {
  it('joins that Field instead of bringing its own, and hands its value to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() =>
      h(Form, { onFormSubmit }, () => [
        h(Field, { name: 'price' }, () => [h(FieldLabel, { nativeLabel: false }, () => 'Price'), h(Slider, { defaultValue: [40], label: 'Ignored' }), h(FieldDescription, null, () => 'Up to €400.')]),
      ]),
    )
    expect(document.querySelectorAll('[data-slot="field"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-slot="field-label"]')).toHaveLength(1)
    expect($('[role="slider"]').getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect($('[role="slider"]').getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ price: [40] }, expect.anything())
  })
})

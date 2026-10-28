// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import { RatingInput } from '../../ui/rating-input'
import Demo from '../../ui/rating-input/rating-input.example.vue'

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
const marks = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
const filled = () => marks().filter((mark) => !mark.querySelector('.fui-rating-dot-empty, .fui-rating-icon-empty')).length
const submit = () => $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
afterEach(() => app?.unmount())

describe('RatingInput', () => {
  it('draws one named mark per step, filled up to the value', async () => {
    await mount(() => h(RatingInput, { defaultValue: 3 }))
    expect(marks().map((mark) => mark.getAttribute('aria-label'))).toEqual([1, 2, 3, 4, 5].map((n) => `${n} out of 5`))
    expect(filled()).toBe(3)
    expect(marks()[2]!.getAttribute('aria-checked')).toBe('true')
  })

  it('draws stars, filled up to the value', async () => {
    await mount(() => h(RatingInput, { defaultValue: 2, shape: 'star', length: 4 }))
    expect(document.querySelectorAll('[data-slot="rating-icon"]')).toHaveLength(4)
    expect(document.querySelectorAll('.fui-rating-icon-full')).toHaveLength(2)
    expect(document.querySelectorAll('.fui-rating-icon-empty')).toHaveLength(2)
    expect(document.querySelectorAll('.fui-rating-input-item-star')).toHaveLength(4)
  })

  it('fills up to the pick and reports it', async () => {
    const onUpdate = vi.fn()
    await mount(() => h(RatingInput, { 'onUpdate:modelValue': onUpdate }))
    expect(filled()).toBe(0)
    marks()[3]!.click()
    await settle()
    expect(onUpdate).toHaveBeenCalledWith(4)
    expect(filled()).toBe(4)
  })

  it('previews the mark under the pointer', async () => {
    await mount(() => h(RatingInput, { defaultValue: 1 }))
    marks()[4]!.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(filled()).toBe(5)
    $('[data-slot="rating-input"]').dispatchEvent(new MouseEvent('mouseleave'))
    await nextTick()
    expect(filled()).toBe(1)
  })

  it('follows a controlled value', async () => {
    const value = ref(2)
    await mount(() => h(RatingInput, { modelValue: value.value }))
    value.value = 5
    await settle()
    expect(filled()).toBe(5)
  })
})

describe('a RatingInput inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'score', disabled: true }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Your rating'),
          h(RatingInput, { defaultValue: 4 }),
          h(FieldDescription, null, () => 'Tap a dot.'),
        ]),
      ]),
    )
    const group = $('[role="radiogroup"]')
    expect(group.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(group.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect(marks().every((mark) => mark.disabled)).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="score"]')?.value).toBe('4')
  })

  it('focuses the picked mark when its label is clicked', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, { nativeLabel: false }, () => 'Your rating'), h(RatingInput, { defaultValue: 2 })]))
    $('[data-slot="field-label"]').click()
    expect(document.activeElement).toBe(marks()[1])
  })

  it('is missing until a mark is picked, and hands the pick to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'score', required: true }, () => [h(RatingInput), h(FieldError, { match: 'valueMissing' }, () => 'Rate it.')])))
    submit()
    await settle()
    expect($('[role="radiogroup"]').getAttribute('aria-invalid')).toBe('true')
    expect($('[data-slot="field-error"]').textContent).toBe('Rate it.')
    expect(onFormSubmit).not.toHaveBeenCalled()

    marks()[2]!.click()
    await settle()
    submit()
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ score: 3 }, expect.anything())
  })

  it('counts a cleared rating as missing', async () => {
    const onFormSubmit = vi.fn()
    await mount(() =>
      h(Form, { onFormSubmit }, () =>
        h(Field, { name: 'score', required: true }, () => [h(RatingInput, { defaultValue: 2, clearable: true }), h(FieldError, { match: 'valueMissing' }, () => 'Rate it.')]),
      ),
    )
    marks()[1]!.click()
    await settle()
    expect(filled()).toBe(0)
    submit()
    await settle()
    expect($('[data-slot="field-error"]').textContent).toBe('Rate it.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('demo names its group with a label', async () => {
    await mount(() => h(Demo))
    const group = $('[role="radiogroup"]')
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent).toBe('Your rating')
  })
})

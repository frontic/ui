// @vitest-environment happy-dom
import { CalendarDate } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { DateRangePicker } from '../../ui/date-range-picker'
import { Field } from '../../ui/field'
import { Form } from '../../ui/form'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '../../ui/number-field'
import { RadioAccordion, RadioAccordionItem, RadioAccordionTrigger } from '../../ui/radio-accordion'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import { RatingInput } from '../../ui/rating-input'
import { Slider } from '../../ui/slider'
import { Switch } from '../../ui/switch'
import { TagsInput, TagsInputInput } from '../../ui/tags-input'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group'

let app: ReturnType<typeof createApp> | undefined
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
afterEach(() => app?.unmount())

interface Case {
  name: string
  value: unknown
  render: (props: Record<string, unknown>) => unknown
  change: () => void | Promise<void>
}

const cases: Case[] = [
  {
    name: 'RadioGroup',
    value: 'standard',
    render: (props) => h(RadioGroup, props, () => ['standard', 'express'].map((value) => h(RadioGroupItem, { value }))),
    change: () => document.querySelectorAll<HTMLElement>('[role="radio"]')[1]!.click(),
  },
  {
    name: 'RadioAccordion',
    value: 'standard',
    render: (props) => h(RadioAccordion, props, () => ['standard', 'express'].map((value) => h(RadioAccordionItem, { value }, () => h(RadioAccordionTrigger, null, () => value)))),
    change: () => document.querySelectorAll<HTMLElement>('[role="radio"]')[1]!.click(),
  },
  {
    name: 'RatingInput',
    value: 4,
    render: (props) => h(RatingInput, props),
    change: () => document.querySelectorAll<HTMLElement>('[role="radio"]')[1]!.click(),
  },
  {
    name: 'ToggleGroup',
    value: 'M',
    render: (props) => h(ToggleGroup, { type: 'single', ...props }, () => ['S', 'M'].map((value) => h(ToggleGroupItem, { value }, () => value))),
    change: () => document.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]')[1]!.click(),
  },
  {
    name: 'Switch',
    value: true,
    render: (props) => h(Switch, props),
    change: () => $('[data-slot="switch"]').click(),
  },
  {
    name: 'Slider',
    value: [40],
    render: (props) => h(Slider, props),
    change: () => void $('[role="slider"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
  },
  {
    name: 'NumberField',
    value: 2,
    render: (props) => h(NumberField, props, () => h(NumberFieldContent, null, () => [h(NumberFieldDecrement), h(NumberFieldInput), h(NumberFieldIncrement)])),
    change: () => {
      $('[data-slot="number-field-increment"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      $('[data-slot="number-field-increment"]').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    },
  },
  {
    name: 'TagsInput',
    value: ['Merino'],
    render: (props) => h(TagsInput, props, () => h(TagsInputInput)),
    change: () => {
      const input = $('input:not([data-hidden])') as HTMLInputElement
      input.value = 'Down'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    },
  },
  {
    name: 'DateRangePicker',
    value: { start: new CalendarDate(2026, 10, 24), end: new CalendarDate(2026, 10, 27) },
    render: (props) => h(DateRangePicker, props),
    change: () => void $('[data-reka-date-field-segment="day"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })),
  },
]

describe('a controlled control inside a Field whose parent rejects a change', () => {
  it.each(cases)('$name keeps handing the Field the value its parent holds', async ({ value, render, change }) => {
    const onFormSubmit = vi.fn()
    const onUpdate = vi.fn()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Form, { onFormSubmit }, () => h(Field, { name: 'choice' }, () => render({ modelValue: value, 'onUpdate:modelValue': onUpdate }))) })
    app.mount('#app')
    await settle()
    await change()
    await settle()
    expect(onUpdate).toHaveBeenCalled()
    $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await settle()
    expect(onFormSubmit).toHaveBeenCalledWith({ choice: value }, expect.anything())
  })
})

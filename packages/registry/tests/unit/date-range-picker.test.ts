// @vitest-environment happy-dom
import { CalendarDate } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { DateRangePicker } from '../../ui/date-range-picker'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await settle()
}
const settle = async (ms = 0) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)
const text = () => $('[data-slot="date-range-picker"]')!.textContent!.replace(/\s/g, '')
const submit = async () => {
  $('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
const open = async () => {
  $('[data-slot="date-picker-trigger"]')!.click()
  await settle(50)
}
const day = (n: number) => [...document.querySelectorAll<HTMLElement>('[data-slot="range-calendar-trigger"]:not([data-outside-view])')].find((cell) => cell.textContent?.trim() === String(n))!
const october = { start: new CalendarDate(2026, 10, 24), end: new CalendarDate(2026, 10, 27) }
afterEach(() => app?.unmount())

describe('a DateRangePicker', () => {
  it('shows the start and end as segments and opens our range calendar on them', async () => {
    await mount(() => h(DateRangePicker, { locale: 'en-US', defaultValue: october }))
    expect(text()).toBe('10/24/2026–10/27/2026')
    await open()
    expect($('[data-slot="range-calendar"]')).not.toBeNull()
    expect([...document.querySelectorAll('[data-slot="range-calendar-trigger"][data-selected]')].map((cell) => cell.textContent?.trim())).toEqual(['24', '25', '26', '27'])
    expect((document.activeElement as HTMLElement).textContent?.trim()).toBe('24')
  })

  it('takes a range picked in the calendar and closes it', async () => {
    const onUpdate = vi.fn()
    await mount(() => h(DateRangePicker, { locale: 'en-US', defaultValue: october, 'onUpdate:modelValue': onUpdate }))
    await open()
    day(12).click()
    await settle()
    day(15).click()
    await settle(50)
    const range = onUpdate.mock.calls.at(-1)?.[0]
    expect([String(range.start), String(range.end)]).toEqual(['2026-10-12', '2026-10-15'])
    expect(text()).toBe('10/12/2026–10/15/2026')
    expect($('[data-slot="range-calendar"]')).toBeNull()
  })

  it('puts attributes on the field', async () => {
    await mount(() => h(DateRangePicker, { title: 'Away', 'data-testid': 'away' }))
    expect($('[data-slot="date-range-picker"]')!.title).toBe('Away')
    expect($('[data-slot="date-range-picker"]')!.dataset.testid).toBe('away')
  })
})

describe('a DateRangePicker inside a Field', () => {
  it('takes its label, description and name from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'away' }, () => [h(FieldLabel, { nativeLabel: false }, () => 'Away'), h(DateRangePicker, { defaultValue: october }), h(FieldDescription, null, () => 'Up to four weeks.')]),
      ]),
    )
    const group = $('[data-slot="date-range-picker"]')!
    expect(group.getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]')!.id)
    expect(group.getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]')!.id)
    expect(document.querySelector<HTMLInputElement>('input[name="away"]')?.value).toBe('2026-10-24 - 2026-10-27')
  })

  it('is missing until both dates are set', async () => {
    const onFormSubmit = vi.fn()
    await mount(() =>
      h(Form, { onFormSubmit }, () =>
        h(Field, { name: 'away', required: true }, () => [
          h(DateRangePicker, { defaultValue: { start: october.start, end: undefined } }),
          h(FieldError, { match: 'valueMissing' }, () => 'Pick your dates.'),
        ]),
      ),
    )
    await submit()
    expect($('[data-slot="field-error"]')?.textContent).toBe('Pick your dates.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('keeps the Field from validating while the end is picked in the calendar', async () => {
    await mount(() =>
      h(Field, { name: 'away', required: true, validationMode: 'onBlur' }, () => [
        h(DateRangePicker, { defaultValue: { start: october.start, end: undefined } }),
        h(FieldError, { match: 'valueMissing' }, () => 'Pick your dates.'),
      ]),
    )
    $('[data-reka-date-field-segment="day"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await settle()
    $('[data-slot="date-picker-trigger"]')!.focus()
    await open()
    expect(document.activeElement?.closest('[data-slot="date-picker-content"]')).not.toBeNull()
    expect($('[data-slot="field-error"]')).toBeNull()
  })

  it('stays in the field when the calendar closes back onto its button', async () => {
    await mount(() =>
      h(Field, { name: 'away', required: true, validationMode: 'onBlur' }, () => [
        h(DateRangePicker, { defaultValue: { start: october.start, end: undefined } }),
        h(FieldError, { match: 'valueMissing' }, () => 'Pick your dates.'),
      ]),
    )
    $('[data-reka-date-field-segment="day"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await settle()
    $('[data-slot="date-picker-trigger"]')!.focus()
    await open()
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle(50)
    expect($('[data-slot="range-calendar"]')).toBeNull()
    expect(document.activeElement?.getAttribute('data-slot')).toBe('date-picker-trigger')
    expect($('[data-slot="field-error"]')).toBeNull()
  })

  it('counts leaving from the calendar as leaving the field', async () => {
    await mount(() => [
      h(Field, { name: 'away', required: true, validationMode: 'onBlur' }, () => [
        h(DateRangePicker, { defaultValue: { start: october.start, end: undefined } }),
        h(FieldError, { match: 'valueMissing' }, () => 'Pick your dates.'),
      ]),
      h('button', { id: 'elsewhere' }, 'Elsewhere'),
    ])
    $('[data-reka-date-field-segment="day"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await settle()
    $('[data-slot="date-picker-trigger"]')!.focus()
    await open()
    $('#elsewhere')!.focus()
    await settle(50)
    expect($('[data-slot="range-calendar"]')).toBeNull()
    expect($('[data-slot="field-error"]')?.textContent).toBe('Pick your dates.')
  })

  it('hands a set range to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'away', required: true }, () => h(DateRangePicker, { defaultValue: october }))))
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ away: october }, expect.anything())
  })
})

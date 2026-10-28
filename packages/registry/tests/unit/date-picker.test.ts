// @vitest-environment happy-dom
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { DatePicker } from '../../ui/date-picker'
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
const text = () => [...document.querySelectorAll('[data-slot="date-field-input"]')].map((segment) => segment.textContent).join('')
const submit = async () => {
  $('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
const open = async () => {
  $('[data-slot="date-picker-trigger"]')!.click()
  await settle(50)
}
afterEach(() => app?.unmount())

describe('a DatePicker', () => {
  it('shows the date as segments and opens our calendar on the picked day', async () => {
    await mount(() => h(DatePicker, { locale: 'en-US', defaultValue: new CalendarDate(2026, 10, 24) }))
    expect(text()).toBe('10/24/2026')
    expect($('[data-slot="date-picker-trigger"]')!.getAttribute('aria-label')).toBe('Open calendar')
    await open()
    expect($('[data-slot="calendar"]')).not.toBeNull()
    expect($('[data-slot="calendar-cell-trigger"][data-selected]')?.textContent?.trim()).toBe('24')
  })

  it('takes a day picked in the calendar and closes it', async () => {
    const onUpdate = vi.fn()
    await mount(() => h(DatePicker, { locale: 'en-US', defaultValue: new CalendarDate(2026, 10, 24), 'onUpdate:modelValue': onUpdate }))
    await open()
    const day = [...document.querySelectorAll<HTMLElement>('[data-slot="calendar-cell-trigger"]:not([data-outside-view])')].find((cell) => cell.textContent?.trim() === '27')!
    day.click()
    await settle(50)
    expect(String(onUpdate.mock.calls.at(-1)?.[0])).toBe('2026-10-27')
    expect(text()).toBe('10/27/2026')
    expect($('[data-slot="calendar"]')).toBeNull()
  })

  it('puts attributes on the field', async () => {
    await mount(() => h(DatePicker, { title: 'Pickup date', 'data-testid': 'pickup' }))
    expect($('[data-slot="date-picker"]')!.title).toBe('Pickup date')
    expect($('[data-slot="date-picker"]')!.dataset.testid).toBe('pickup')
  })

  it('opens on a day that can be picked when today cannot', async () => {
    const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
    await mount(() => h(DatePicker, { locale: 'en-US', minValue: tomorrow }))
    await open()
    const focused = document.activeElement as HTMLElement
    expect(focused.dataset.slot).toBe('calendar-cell-trigger')
    expect(focused.hasAttribute('data-disabled')).toBe(false)
  })
})

describe('a DatePicker inside a Field', () => {
  it('takes its label, description and name from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'pickup' }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Pick up'),
          h(DatePicker, { defaultValue: new CalendarDate(2026, 10, 24) }),
          h(FieldDescription, null, () => 'Open Monday to Friday.'),
        ]),
      ]),
    )
    const group = $('[data-slot="date-picker"]')!
    expect(group.getAttribute('aria-labelledby')).toContain($('[data-slot="field-label"]')!.id)
    expect(group.getAttribute('aria-describedby')).toContain($('[data-slot="field-description"]')!.id)
    expect(document.querySelector<HTMLInputElement>('input[name="pickup"]')?.value).toBe('2026-10-24')
  })

  it('is missing until a date is set, and hands a set date to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'pickup', required: true }, () => [h(DatePicker), h(FieldError, { match: 'valueMissing' }, () => 'Pick a date.')])))
    await submit()
    expect($('[data-slot="field-error"]')?.textContent).toBe('Pick a date.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })
})

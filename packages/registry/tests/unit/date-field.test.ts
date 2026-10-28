// @vitest-environment happy-dom
import { CalendarDate } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { DateField } from '../../ui/date-field'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'

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
const segments = () => [...document.querySelectorAll<HTMLElement>('[data-slot="date-field-input"]')]
const submit = async () => {
  $('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
afterEach(() => app?.unmount())

describe('a DateField', () => {
  it('lays out its segments in the locale’s order, empty ones marked as placeholders', async () => {
    await mount(() => h(DateField, { locale: 'en-US' }))
    expect(segments().map((segment) => segment.getAttribute('data-reka-date-field-segment'))).toEqual(['month', 'literal', 'day', 'literal', 'year'])
    expect(segments().filter((segment) => segment.hasAttribute('data-placeholder'))).toHaveLength(3)
  })

  it('shows a date it is given', async () => {
    await mount(() => h(DateField, { locale: 'de-DE', defaultValue: new CalendarDate(2026, 10, 24) }))
    expect(
      segments()
        .map((segment) => segment.textContent)
        .join(''),
    ).toBe('24.10.2026')
  })
})

describe('a DateField inside a Field', () => {
  it('takes its label, description, name and disabled state from the Field', async () => {
    await mount(() =>
      h('form', [
        h(Field, { name: 'arrival', disabled: true }, () => [
          h(FieldLabel, { nativeLabel: false }, () => 'Arrival'),
          h(DateField, { defaultValue: new CalendarDate(2026, 10, 24) }),
          h(FieldDescription, null, () => 'We hold your order for seven days.'),
        ]),
      ]),
    )
    const group = $('[data-slot="date-field"]')
    expect(group.getAttribute('aria-labelledby')).toContain($('[data-slot="field-label"]').id)
    expect(group.getAttribute('aria-describedby')).toContain($('[data-slot="field-description"]').id)
    expect(group.hasAttribute('data-disabled')).toBe(true)
    expect(document.querySelector<HTMLInputElement>('input[name="arrival"]')?.value).toBe('2026-10-24')
  })

  it('is missing until a date is set, and hands the date to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'arrival', required: true }, () => [h(DateField), h(FieldError, { match: 'valueMissing' }, () => 'Pick a date.')])))
    await submit()
    expect($('[data-slot="field-error"]').textContent).toBe('Pick a date.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('hands a set date to the form', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(Form, { onFormSubmit }, () => h(Field, { name: 'arrival', required: true }, () => h(DateField, { defaultValue: new CalendarDate(2026, 10, 24) }))))
    await submit()
    expect(String(onFormSubmit.mock.calls[0]?.[0].arrival)).toBe('2026-10-24')
  })
})

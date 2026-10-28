// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import Demo from '../../ui/field/field.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

it('rates the new account password as the user types it', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Demo) })
  app.mount('#app')
  await nextTick()
  const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
  const meter = () => document.querySelector('[data-slot="progress"]')!
  const rating = () => [meter().getAttribute('aria-valuenow'), meter().closest('[data-slot="field"]')!.querySelector('[data-slot="field-description"]:last-of-type')!.textContent!.trim()]
  expect(input.getAttribute('autocomplete')).toBe('new-password')

  const type = async (value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await nextTick()
  }
  const field = input.closest('[data-slot="field"]')!
  const leave = async () => {
    input.dispatchEvent(new FocusEvent('blur'))
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await nextTick()
    await nextTick()
  }
  // While the user types, the meter guides and nothing turns red.
  await type('par')
  expect(rating()).toEqual(['0', 'Use at least 8 characters.'])
  expect(field.hasAttribute('data-invalid')).toBe(false)
  // Leaving it short is the error.
  await leave()
  expect(field.hasAttribute('data-invalid')).toBe(true)
  // FieldValidity hands over: once the field is too short, the error stands alone.
  expect([...field.querySelectorAll('[data-slot="field-description"], [data-slot="field-error"]')].map((node) => node.textContent!.trim())).toEqual([
    'Optional. Add a password to track this order later.',
    'A password needs at least 8 characters.',
  ])
  await type('parkaparka')
  expect(rating()).toEqual(['25', 'Weak'])
  await leave()
  expect(field.hasAttribute('data-invalid')).toBe(false)
  await type('Parka2026!')
  expect(rating()).toEqual(['100', 'Strong'])
})

it('puts the order-updates switch before its label, where its touch area cannot scroll a phone sideways, and keeps the label beside it', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Demo) })
  app.mount('#app')
  await nextTick()
  const field = document.querySelector('[data-slot="switch"]')!.closest('[data-slot="field"]')!
  const children = [...field.children].map((child) => child.getAttribute('data-slot'))
  const label = field.querySelector('[data-slot="field-label"]')!
  expect([children, field.classList.contains('flex-row'), label.classList.contains('fui-field-label-beside')]).toEqual([['switch', 'field-content'], true, true])
})

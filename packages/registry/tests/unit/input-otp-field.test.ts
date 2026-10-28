// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import { InputOtp, InputOTPGroup, InputOTPSlot } from '../../ui/input-otp'

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

const code = (props: Record<string, unknown> = {}) => h(InputOtp, { maxlength: 4, ...props }, () => h(InputOTPGroup, null, () => [0, 1, 2, 3].map((index) => h(InputOTPSlot, { index }))))
const input = () => $('input[data-input-otp]') as HTMLInputElement
const type = async (value: string) => {
  input().value = value
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('an InputOtp inside a Field', () => {
  it('takes its label, description, name, required and disabled state from the Field', async () => {
    await mount(() => h(Field, { name: 'code', required: true, disabled: true }, () => [h(FieldLabel, null, () => 'Verification code'), code(), h(FieldDescription, null, () => 'We sent it to you.')]))
    expect(input().id).not.toBe('')
    expect($('[data-slot="field-label"]').getAttribute('for')).toBe(input().id)
    expect(input().getAttribute('aria-labelledby')).toBe($('[data-slot="field-label"]').id)
    expect(input().getAttribute('aria-describedby')).toBe($('[data-slot="field-description"]').id)
    expect([input().name, input().required, input().disabled]).toEqual(['code', true, true])
  })

  it('counts as filled only once every slot has a character', async () => {
    await mount(() => h(Field, null, () => code()))
    await type('12')
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(false)
    await type('1234')
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })

  it('tells the Field when code sets the value', async () => {
    const value = ref('')
    await mount(() => h(Field, null, () => code({ modelValue: value.value })))
    value.value = '1234'
    await nextTick()
    await nextTick()
    expect($('[data-slot="field"]').hasAttribute('data-filled')).toBe(true)
  })
})

describe('an InputOtp alone', () => {
  it('renders without a Field', async () => {
    await mount(() => code())
    expect(input().hasAttribute('aria-labelledby')).toBe(false)
  })
})

describe('an InputOtp on a right-to-left page', () => {
  const recipe = (JSON.parse(readFileSync(join(import.meta.dirname, '../../ui/input-otp/input-otp.json'), 'utf8')) as { recipes: Record<string, { base: Record<string, unknown> }> }).recipes[
    'input-otp'
  ].base

  it('lays its slots out left to right, the way the code’s digits read, from its markup', async () => {
    await mount(() => h('div', { dir: 'rtl' }, code({ 'data-test': 'code' })))
    const wrapper = $('[data-input-otp-container]').parentElement!.closest('[dir]')!
    expect([wrapper.getAttribute('data-slot'), wrapper.getAttribute('dir'), wrapper.className]).toEqual(['input-otp-root', 'ltr', 'contents'])
    expect(recipe).not.toHaveProperty('direction')
    expect(input().getAttribute('data-test')).toBe('code')
  })

  it('shrinks to its slots so it starts the line, without changing how a row aligns it', () => {
    expect(recipe.width).toBe('fit')
    expect(recipe).not.toHaveProperty('alignSelf')
  })
})

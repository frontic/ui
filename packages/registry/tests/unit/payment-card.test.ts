// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { Field, FieldError, FieldLabel } from '../../ui/field'
import { Form } from '../../ui/form'
import {
  formatPaymentCardExpiry,
  formatPaymentCardNumber,
  PaymentCard,
  paymentCardCvcLengths,
  PaymentCardCvc,
  PaymentCardExpiry,
  paymentCardExpiryProblem,
  PaymentCardNumber,
  paymentCardNumberProblem,
  paymentCardScheme,
} from '../../ui/payment-card'

describe('the card helpers', () => {
  it.each([
    ['4242424242424242', 'visa', '4242 4242 4242 4242'],
    ['4000000000000000006', 'visa', '4000 0000 0000 0000006'],
    ['5555555555554444', 'mastercard', '5555 5555 5555 4444'],
    ['2223003122003222', 'mastercard', '2223 0031 2200 3222'],
    ['378282246310005', 'amex', '3782 822463 10005'],
    ['6011111111111117', 'discover', '6011 1111 1111 1117'],
    ['3056930009020004', 'diners', '3056 930009 020004'],
    ['3566002020360505', 'jcb', '3566 0020 2036 0505'],
    ['6200000000000005', 'unionpay', '6200 0000 0000 0005'],
    ['2221000000000009', 'mastercard', '2221 0000 0000 0009'],
    ['6759649826438453', 'maestro', '6759 6498 2643 8453'],
  ])('reads %s as %s and spaces it as the card prints it', (digits, brand, spaced) => {
    expect(paymentCardScheme(digits)?.brand).toBe(brand)
    expect(formatPaymentCardNumber(digits)).toBe(spaced)
    expect(paymentCardNumberProblem(digits)).toBeUndefined()
  })

  it('tells a short number from one whose checksum fails, and cuts digits past the longest length', () => {
    expect(paymentCardNumberProblem('42424242')).toBe('incomplete')
    expect(paymentCardNumberProblem('4242424242424241')).toBe('invalid')
    expect(paymentCardNumberProblem('424242424242424')).toBe('incomplete')
    expect(paymentCardNumberProblem('5555555555554443')).toBe('invalid')
    expect(formatPaymentCardNumber('3782822463100059999')).toBe('3782 822463 10005')
  })

  it('asks four digits of an Amex security code, three of the rest, and takes three or four before the brand is known', () => {
    expect(paymentCardCvcLengths('amex')).toEqual({ min: 4, max: 4 })
    expect(paymentCardCvcLengths('visa')).toEqual({ min: 3, max: 3 })
    expect(paymentCardCvcLengths(undefined)).toEqual({ min: 3, max: 4 })
  })

  it('writes the expiry as MM/YY and tells a short, impossible or past one', () => {
    expect(formatPaymentCardExpiry('4')).toBe('04')
    expect(formatPaymentCardExpiry('1228')).toBe('12/28')
    expect(formatPaymentCardExpiry('12/289')).toBe('12/28')
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 13) })
    try {
      expect(paymentCardExpiryProblem('12/2')).toBe('incomplete')
      expect(paymentCardExpiryProblem('13/28')).toBe('invalid')
      expect(paymentCardExpiryProblem('12/50')).toBe('invalid')
      expect(paymentCardExpiryProblem('09/26')).toBe('expired')
      expect(paymentCardExpiryProblem('05/24')).toBe('expired')
      expect(paymentCardExpiryProblem('10/26')).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })
})

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await settle()
}
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)
const field = (slot: string) => $(`[data-slot="${slot}"] input[data-slot="input-group-control"]`) as HTMLInputElement
const type = async (input: HTMLInputElement, text: string) => {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
}
const submit = async () => {
  $('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await settle()
}
const brands = () => [...document.querySelectorAll<HTMLElement>('[data-slot="payment-card-brand"]')].map((logo) => logo.dataset.brand)
afterEach(() => app?.unmount())

describe('a PaymentCardNumber', () => {
  it('spaces the number as it is typed, hands out its digits and shows only the brand it finds', async () => {
    const onUpdate = vi.fn()
    await mount(() => h(PaymentCardNumber, { 'onUpdate:modelValue': onUpdate, 'data-testid': 'number' }))
    expect(brands()).toEqual(['visa', 'mastercard', 'amex', 'discover'])
    expect($('[data-slot="payment-card-brands"]')!.hasAttribute('partial')).toBe(false)
    await type(field('payment-card-number'), '4242a424242424242')
    expect(field('payment-card-number').value).toBe('4242 4242 4242 4242')
    expect(field('payment-card-number').dataset.testid).toBe('number')
    expect(onUpdate).toHaveBeenLastCalledWith('4242424242424242')
    expect(brands()).toEqual(['visa'])
  })

  it('shows only the brands it is given, and a generic card for a brand outside them', async () => {
    await mount(() => h(PaymentCardNumber, { brands: ['visa', 'mastercard', 'amex'] }))
    expect(brands()).toEqual(['visa', 'mastercard', 'amex'])
    await type(field('payment-card-number'), '6011111111111117')
    expect(brands()).toEqual([])
    expect($('[data-slot="payment-card-brands"] [data-icon]')).not.toBeNull()
    await type(field('payment-card-number'), '378282246310005')
    expect(brands()).toEqual(['amex'])
  })

  it('drops a letter typed into a number it already shows', async () => {
    await mount(() => h(PaymentCardNumber))
    await type(field('payment-card-number'), '4242')
    await type(field('payment-card-number'), '4242x')
    expect(field('payment-card-number').value).toBe('4242')
  })

  it('accepts a number handed to it with spaces, as it shows it', async () => {
    await mount(() => h(PaymentCardNumber, { modelValue: '4242 4242 4242 4242' }))
    expect(field('payment-card-number').value).toBe('4242 4242 4242 4242')
    expect(field('payment-card-number').validationMessage).toBe('')
    expect(brands()).toEqual(['visa'])
  })

  it('keeps its digit groups left-to-right, so a right-to-left page does not reverse them', async () => {
    await mount(() => h(PaymentCardNumber))
    expect(field('payment-card-number').dir).toBe('ltr')
  })
})

describe('a PaymentCardCvc', () => {
  it('counts only the digits of a code handed to it', async () => {
    await mount(() => h(PaymentCardCvc, { modelValue: '1-2' }))
    expect(field('payment-card-cvc').value).toBe('12')
    expect(field('payment-card-cvc').validationMessage).toBe('Enter the full security code.')
  })
})

describe('a PaymentCard inside a Form', () => {
  const card = (onFormSubmit: () => void) => () =>
    h(Form, { onFormSubmit }, () =>
      h(PaymentCard, null, () => [
        h(Field, { name: 'number', required: true }, () => [h(FieldLabel, null, () => 'Card number'), h(PaymentCardNumber), h(FieldError)]),
        h(Field, { name: 'expiry', required: true }, () => [h(PaymentCardExpiry), h(FieldError)]),
        h(Field, { name: 'cvc', required: true }, () => [h(PaymentCardCvc), h(FieldError)]),
      ]),
    )
  const errors = () => [...document.querySelectorAll('[data-slot="field-error"]')].map((error) => error.textContent)

  it('names a short number, a failing checksum, an expired month and a short code, and holds the submit', async () => {
    const onFormSubmit = vi.fn()
    await mount(card(onFormSubmit))
    await type(field('payment-card-number'), '4242 4242')
    await type(field('payment-card-expiry'), '0124')
    await type(field('payment-card-cvc'), '12')
    await submit()
    expect(errors()).toEqual(['Enter the full card number.', 'This card has expired.', 'Enter the full security code.'])
    await type(field('payment-card-number'), '4242424242424241')
    await submit()
    expect(errors()[0]).toBe('This card number is not valid.')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })

  it('submits a card it accepts, and sizes the security code to the brand', async () => {
    const onFormSubmit = vi.fn()
    await mount(card(onFormSubmit))
    await type(field('payment-card-number'), '378282246310005')
    await type(field('payment-card-expiry'), '1228')
    await type(field('payment-card-cvc'), '12345')
    expect(field('payment-card-cvc').value).toBe('1234')
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ number: '3782 822463 10005', expiry: '12/28', cvc: '1234' }, expect.anything())
  })

  it('takes a four-digit code typed before the number, and keeps it for an Amex', async () => {
    const onFormSubmit = vi.fn()
    await mount(card(onFormSubmit))
    await type(field('payment-card-cvc'), '1234')
    expect(field('payment-card-cvc').value).toBe('1234')
    await type(field('payment-card-number'), '378282246310005')
    await type(field('payment-card-expiry'), '1228')
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith(expect.objectContaining({ cvc: '1234' }), expect.anything())
  })

  it('cuts a typed code back when the brand found asks for fewer digits', async () => {
    await mount(card(vi.fn()))
    await type(field('payment-card-cvc'), '1234')
    await type(field('payment-card-number'), '4242')
    expect(field('payment-card-cvc').value).toBe('123')
  })
})

describe("a PaymentCardNumber framing a provider's hosted field", () => {
  it("takes required, the provider's error and its brand from the state it reports, and sends a label click to the provider", async () => {
    const onFormSubmit = vi.fn()
    const focus = vi.fn()
    const hosted = reactive({ empty: true, complete: false, error: undefined as string | undefined, brand: undefined as 'visa' | undefined, focus })
    await mount(() =>
      h(Form, { onFormSubmit }, () =>
        h(Field, { name: 'number', required: true }, () => [h(FieldLabel, null, () => 'Card number'), h(PaymentCardNumber, { hosted }, () => h('iframe', { title: 'Card number' })), h(FieldError)]),
      ),
    )
    expect($('[data-slot="payment-card-host"] iframe')).not.toBeNull()
    expect($('input[data-slot="input-group-control"]')).toBeNull()
    // The browser focuses what the label's `for` names; happy-dom does not.
    document.getElementById(($('[data-slot="field-label"]') as HTMLLabelElement).htmlFor)!.focus()
    expect(focus).toHaveBeenCalled()

    await submit()
    expect($('[data-slot="field-error"]')?.textContent).not.toBe('')
    expect($('[data-slot="field"]')!.hasAttribute('data-invalid')).toBe(true)

    Object.assign(hosted, { empty: false, brand: 'visa' })
    await settle()
    await submit()
    expect($('[data-slot="field-error"]')?.textContent).toBe('Enter the full card number.')
    expect(brands()).toEqual(['visa'])

    hosted.error = 'Your card number is invalid.'
    await settle()
    await submit()
    expect($('[data-slot="field-error"]')?.textContent).toBe('Your card number is invalid.')

    Object.assign(hosted, { error: undefined, complete: true })
    await settle()
    await submit()
    expect(onFormSubmit).toHaveBeenCalled()
  })
})

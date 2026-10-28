import { describe, expect, it } from 'vitest'
import { cartCurrency, clampQuantity, discounted, itemCount, lineTotal, savings, shippingFor, subtotal, type AppliedDiscount, type CartLine } from '../../lib/cart'
import { formatPrice } from '../../lib/format'

const jpy = (amount: number, quantity = 1, ref?: number): CartLine => ({ id: String(amount), name: 'x', price: { amount, currency: 'JPY', precision: 0, ref }, quantity })
const eur = (amount: number, quantity = 1, ref?: number): CartLine => ({ id: String(amount), name: 'x', price: { amount, currency: 'EUR', ref }, quantity })

describe('the cart lib item', () => {
  it('keeps precision on every total', () => {
    expect(subtotal([jpy(1500, 2)])).toEqual({ amount: 3000, currency: 'JPY', precision: 0 })
    expect(formatPrice(subtotal([jpy(1500, 2)]), 'en-US')).toBe('¥3,000')
    expect(savings([jpy(1200, 2, 1500)])).toEqual({ amount: 600, currency: 'JPY', precision: 0 })
    expect(lineTotal(jpy(1500, 2)).precision).toBe(0)
  })

  it('takes the currency of the first line, or the fallback for an empty cart', () => {
    expect(cartCurrency([jpy(1)], 'EUR')).toBe('JPY')
    expect(cartCurrency([], 'EUR')).toBe('EUR')
    expect(subtotal([], 'USD')).toEqual({ amount: 0, currency: 'USD' })
  })

  it('counts the units, not the lines', () => {
    expect(itemCount([eur(100, 2), eur(200, 3)])).toBe(5)
  })

  it('ships free at exactly the threshold, after promo codes', () => {
    expect(shippingFor({ amount: 5000, currency: 'EUR' }, 495, 5000).amount).toBe(0)
    expect(shippingFor({ amount: 4999, currency: 'EUR' }, 495, 5000).amount).toBe(495)
    expect(shippingFor({ amount: 99999, currency: 'EUR' }, 495).amount).toBe(495)
    expect(shippingFor({ amount: 100, currency: 'JPY', precision: 0 }, 500, 1000)).toEqual({ amount: 500, currency: 'JPY', precision: 0 })
  })

  it('never counts a price above its reference as savings', () => {
    expect(savings([jpy(1200, 1, 1000), jpy(800, 2, 1000)]).amount).toBe(400)
    expect(savings([jpy(800, 2)]).amount).toBe(0)
  })

  it('keeps a reference of 0 and an undefined one', () => {
    expect(lineTotal(jpy(500, 3, 0)).ref).toBe(0)
    expect(lineTotal(jpy(500, 3, 600)).ref).toBe(1800)
    expect(lineTotal(jpy(500, 3)).ref).toBeUndefined()
  })

  it('takes discounts off by kind, never below zero', () => {
    const codes: AppliedDiscount[] = [
      { id: 'a', kind: 'promo', label: 'SAVE', amount: 500 },
      { id: 'b', kind: 'gift-card', label: '•••• 1234', amount: 2000 },
    ]
    expect(discounted({ amount: 5000, currency: 'EUR' }, codes, 'promo').amount).toBe(4500)
    expect(discounted({ amount: 5000, currency: 'EUR' }, codes).amount).toBe(2500)
    expect(discounted({ amount: 1000, currency: 'EUR' }, codes).amount).toBe(0)
  })

  it('keeps a quantity within 1 and the maximum', () => {
    expect(clampQuantity(0, 10)).toBe(1)
    expect(clampQuantity(12, 10)).toBe(10)
    expect(clampQuantity(4, 10)).toBe(4)
  })
})

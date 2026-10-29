import type { PriceType } from '@library/lib/format'

export interface CartLine {
  id: string
  name: string
  /** Size, colour or edition, shown beside the name. */
  variant?: string
  /** The unit price; a `ref` shows the line's saving. */
  price: PriceType
  quantity: number
  image?: string
  /** The product's page; the line's name links to it when set. */
  link?: { path: string }
}

export interface AppliedDiscount {
  id: string
  /** A promo code takes a share off; a gift card pays part of the order. */
  kind: 'promo' | 'gift-card'
  /** The chip's text, e.g. the code or a masked card number. */
  label: string
  /** The summary row's text; falls back to `label`. */
  lineLabel?: string
  /** What it takes off the order, in minor units. */
  amount: number
}

/** The sign before a deducted amount: a true minus, not a hyphen. */
export const MINUS_SIGN = '−'

export function itemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function cartCurrency(lines: CartLine[], fallback: string): string {
  return lines[0]?.price.currency ?? fallback
}

/** `amount` in the cart's money: the first line's currency and precision. */
function money(lines: CartLine[], amount: number, fallback: string): PriceType {
  const precision = lines[0]?.price.precision
  return { amount, currency: cartCurrency(lines, fallback), ...(precision === undefined ? {} : { precision }) }
}

export function subtotal(lines: CartLine[], fallback = 'EUR'): PriceType {
  return money(
    lines,
    lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0),
    fallback,
  )
}

/** What the reduced lines save against their `ref`; a line priced above its `ref` saves nothing. */
export function savings(lines: CartLine[], fallback = 'EUR'): PriceType {
  return money(
    lines,
    lines.reduce((sum, line) => sum + Math.max((line.price.ref ?? line.price.amount) - line.price.amount, 0) * line.quantity, 0),
    fallback,
  )
}

export function lineTotal(line: CartLine): PriceType {
  const { ref, ...price } = line.price
  return { ...price, amount: price.amount * line.quantity, ...(ref === undefined ? {} : { ref: ref * line.quantity }) }
}

/** `total` less the discounts of `kind`, or of every kind; never below 0. */
export function discounted(total: PriceType, discounts: AppliedDiscount[], kind?: AppliedDiscount['kind']): PriceType {
  const off = discounts.reduce((sum, discount) => (kind === undefined || discount.kind === kind ? sum + discount.amount : sum), 0)
  return { ...total, amount: Math.max(total.amount - off, 0) }
}

/** Free once the total after promo codes reaches `freeFrom`, exactly at it included; `cost` otherwise. */
export function shippingFor(afterPromos: PriceType, cost: number, freeFrom?: number): PriceType {
  const { ref: _ref, ...price } = afterPromos
  return { ...price, amount: freeFrom !== undefined && afterPromos.amount >= freeFrom ? 0 : cost }
}

export function clampQuantity(quantity: number, max: number): number {
  return Math.min(Math.max(quantity, 1), max)
}

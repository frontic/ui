import { type DateValue, DateFormatter } from '@internationalized/date'
import { NumberFormatter } from '@internationalized/number'

export interface PriceType {
  /** In minor units: cents for EUR, yen for JPY. */
  amount: number
  /** An ISO 4217 code. */
  currency: string
  /** The digits after the decimal point; 2 when left out. */
  precision?: number
  /** The original price, in the same minor units. */
  ref?: number
}

export function formatPrice(price: PriceType, locale: string): string {
  const precision = price.precision ?? 2
  return new NumberFormatter(locale, { style: 'currency', currency: price.currency, minimumFractionDigits: precision, maximumFractionDigits: precision }).format(price.amount / 10 ** precision)
}

/** A date in UTC unless `options.timeZone` names another; a date-only ISO string is that calendar day, and a string no date parses from prints as written. */
export function formatDate(value: Date | string | DateValue, options: Intl.DateTimeFormatOptions, locale: string): string {
  const timeZone = options.timeZone ?? 'UTC'
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : value.toDate(timeZone)
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : ''
  return new DateFormatter(locale, { ...options, timeZone }).format(date)
}

/** A star rating with one decimal: 4 is "4.0". */
export function formatRating(value: number, locale: string): string {
  return new NumberFormatter(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
}

/** `part` as a whole percent of `whole`; 0 when `whole` is 0. */
export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

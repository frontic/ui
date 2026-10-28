import { CalendarDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice, formatRating, percentOf } from '../../lib/format'

describe('the format lib item', () => {
  it('formats minor units with their precision', () => {
    expect(formatPrice({ amount: 11980, currency: 'EUR' }, 'en-IE')).toBe('€119.80')
    expect(formatPrice({ amount: 11980, currency: 'EUR' }, 'de-DE')).toBe('119,80 €')
    expect(formatPrice({ amount: 1500, currency: 'JPY', precision: 0 }, 'en-US')).toBe('¥1,500')
  })

  it('formats an ISO string, a Date and a CalendarDate in UTC', () => {
    const opts = { year: 'numeric', month: 'short', day: 'numeric' } as const
    expect(formatDate('2026-03-01T23:30:00Z', opts, 'en-US')).toBe('Mar 1, 2026')
    expect(formatDate('2026-03-01', opts, 'en-US')).toBe('Mar 1, 2026')
    expect(formatDate(new Date(Date.UTC(2026, 2, 1)), opts, 'en-US')).toBe('Mar 1, 2026')
    expect(formatDate(new CalendarDate(2026, 3, 1), { ...opts, month: 'long' }, 'de-DE')).toBe('1. März 2026')
  })

  it('prints a string it cannot read as a date as written', () => {
    expect(formatDate('Last spring', { year: 'numeric' }, 'en-US')).toBe('Last spring')
  })

  it('formats a rating with one decimal', () => {
    expect(formatRating(4, 'en')).toBe('4.0')
    expect(formatRating(4.25, 'de')).toBe('4,3')
  })

  it('gives a share in whole percent', () => {
    expect(percentOf(1, 3)).toBe(33)
    expect(percentOf(2, 3)).toBe(67)
    expect(percentOf(1, 0)).toBe(0)
  })
})

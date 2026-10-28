import { describe, expect, it } from 'vitest'
import { initials, interpolate, pageRange } from '../../lib/text'

describe('the text lib item', () => {
  it('takes initials from whitespace, keeping an override', () => {
    expect(initials('Ana  María López')).toBe('AM')
    expect(initials('ana')).toBe('A')
    expect(initials(' Jo Smith ')).toBe('JS')
    expect(initials('x', 'QQ')).toBe('QQ')
  })

  it('fills tokens and leaves unknown ones', () => {
    expect(interpolate('© {year} {brand}', { year: '2026' })).toBe('© 2026 {brand}')
    expect(interpolate('Step {step} of {total}', { step: '2', total: '3' })).toBe('Step 2 of 3')
    expect(interpolate('{year} {year}', { year: '2026' })).toBe('2026 2026')
  })

  it('reads nothing shown for an empty result', () => {
    expect(pageRange(1, 24, 0)).toBeUndefined()
    expect(pageRange(1, 24, 30)).toEqual({ from: 1, to: 24 })
    expect(pageRange(2, 24, 30)).toEqual({ from: 25, to: 30 })
  })
})

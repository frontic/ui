import { describe, expect, it, vi } from 'vitest'
import { useFilterState } from '../../composables/use-filter-state'
import { activeBoolean, activeFilterCount, activeRange, DEFAULT_SWATCH_COLORS, FALLBACK_SWATCH, filterSwatches, type UiFilter } from '../../lib/filter-model'

const filters: UiFilter[] = [
  {
    key: 'color',
    label: 'Colour',
    type: 'color',
    options: [
      { option: 'Red', value: 'red', count: 3, selected: true },
      { option: 'Teal', value: 'teal', count: 1 },
    ],
  },
  { key: 'inStock', label: 'In stock', type: 'boolean', options: [] },
  { key: 'price', label: 'Price', type: 'range', options: [] },
  { key: 'rating', label: 'Rating', type: 'rating', options: [] },
]
const events = () => ({
  add: vi.fn(),
  remove: vi.fn(),
  sort: vi.fn(),
  search: vi.fn(),
  reset: vi.fn(),
})
const state = (activeFilters: Record<string, unknown>, on = events()) =>
  useFilterState(
    {
      filters: () => filters,
      activeFilters: () => activeFilters,
      activeSorting: () => 'default',
      swatchColors: () => DEFAULT_SWATCH_COLORS,
    },
    on,
  )

describe('the filter model', () => {
  it('counts an array switch, an open range and a selected option once each', () => {
    expect(activeFilterCount(filters, { inStock: ['yes'], price: { from: 2000 } })).toBe(3)
    expect(state({ inStock: ['yes'], price: { from: 2000 } }).activeCount.value).toBe(3)
  })

  it('reads a switch as on for true, "true" or a non-empty list', () => {
    expect([true, 'true', ['x'], [], false, undefined].map((value) => activeBoolean({ s: value }, 's'))).toEqual([true, true, true, false, false, false])
  })

  it('assumes no bounds for a range', () => {
    expect(activeRange({ price: { to: 50 } }, 'price')).toEqual({ to: 50 })
    expect(activeRange({}, 'price')).toEqual({})
  })

  it('gives an unnamed colour the fallback swatch', () => {
    expect(filterSwatches(filters[0]!, DEFAULT_SWATCH_COLORS).map((s) => s.hex)).toEqual([DEFAULT_SWATCH_COLORS.red, FALLBACK_SWATCH])
  })
})

describe('the filter state', () => {
  it('toggles an option locally and tells the shop', () => {
    const on = events()
    const s = state({}, on)
    s.toggleFilterOption('color', 'teal')
    expect(on.add).toHaveBeenCalledWith('color', 'teal')
    expect(s.activeBadges.value.map((b) => b.value)).toEqual(['red', 'teal'])
    s.removeTags(['color-red'])
    expect(on.remove).toHaveBeenCalledWith('color', 'red')
  })

  it('sends undefined for the default sorting and resets everything', () => {
    const on = events()
    const s = state({}, on)
    s.handleSort('default')
    expect(on.sort).toHaveBeenCalledWith(undefined)
    s.resetAll()
    expect(s.activeBadges.value).toEqual([])
    expect(on.reset).toHaveBeenCalled()
  })
})

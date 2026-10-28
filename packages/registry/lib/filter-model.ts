export interface UiFilterOption {
  option: string
  value: string
  count: number
  selected?: boolean
  disabled?: boolean
}

export interface UiFilterStats {
  min?: number
  max?: number
  avg?: number
  sum?: number
  total: number
}

export interface UiFilter {
  key: string
  label: string
  type: string
  options: UiFilterOption[]
  data?: { total: UiFilterStats; result: UiFilterStats }
}

export interface UiSort {
  key: string
  label: string
  value: string
}

export type UiFilterValue = string | boolean | number | { from?: number; to?: number }

/** The set filters by key, as the shop's search state holds them. */
export type ActiveFilters = Record<string, unknown>

/** A colour filter's swatch for each common colour name, by lower-case option value. */
export const DEFAULT_SWATCH_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  black: '#1A1A1A',
  navy: '#1E3A5F',
  brown: '#8B4513',
  grey: '#808080',
  gray: '#808080',
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
  pink: '#EC4899',
  beige: '#D2B48C',
  yellow: '#EAB308',
  orange: '#EA580C',
  purple: '#9333EA',
}

/** The swatch of a colour the map does not name. */
export const FALLBACK_SWATCH = '#94A3B8'

/** The lowest star count a rating filter is set to; 0 when it is not set. */
export function activeRating(active: ActiveFilters, key: string): number {
  const value = active[key]
  return value && typeof value === 'object' && 'from' in value ? Number((value as { from: unknown }).from) || 0 : 0
}

/** Whether a switch filter is on: `true`, `'true'` or a non-empty list. */
export function activeBoolean(active: ActiveFilters, key: string): boolean {
  const value = active[key]
  return value === true || value === 'true' || (Array.isArray(value) && value.length > 0)
}

/** The bounds a range filter is set to, either of them open; empty when it is not set. */
export function activeRange(active: ActiveFilters, key: string): { from?: number; to?: number } {
  const value = active[key]
  return value && typeof value === 'object' && !Array.isArray(value) && ('from' in value || 'to' in value) ? (value as { from?: number; to?: number }) : {}
}

/** How many filters are set: each selected option, and each set switch, rating and range once. */
export function activeFilterCount(filters: UiFilter[], active: ActiveFilters): number {
  let count = 0
  for (const filter of filters) {
    if (filter.type === 'rating') count += activeRating(active, filter.key) > 0 ? 1 : 0
    else if (filter.type === 'boolean') count += activeBoolean(active, filter.key) ? 1 : 0
    else if (filter.type === 'range') {
      const range = activeRange(active, filter.key)
      count += range.from !== undefined || range.to !== undefined ? 1 : 0
    } else count += filter.options.filter((option) => option.selected).length
  }
  return count
}

/** A colour filter's options as swatches, each with its hex from `colors`. */
export function filterSwatches(filter: UiFilter, colors: Record<string, string>) {
  return filter.options.map((option) => ({
    ...option,
    label: option.option,
    hex: colors[option.value.toLowerCase()] ?? FALLBACK_SWATCH,
  }))
}

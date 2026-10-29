import type { FilterOption, FilterSwatchOption } from '@library/components/ui/filter'

export interface FiltersListGroup {
  value: string
  label: string
  kind?: 'list'
  options: FilterOption[]
}

export interface FiltersSwatchGroup {
  value: string
  label: string
  kind: 'swatch'
  options: FilterSwatchOption[]
}

export type FiltersGroup = FiltersListGroup | FiltersSwatchGroup

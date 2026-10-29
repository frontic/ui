import { type ActiveFilters, activeFilterCount, filterSwatches, type UiFilter, type UiFilterValue } from '@library/lib/filter-model'
import { computed, ref, watch } from 'vue'

/** What the filter controls tell the shop. */
export interface FilterEvents {
  add: (field: string, value: UiFilterValue) => void
  remove: (field: string, value?: string) => void
  sort: (sortBy?: string) => void
  search?: (term: string) => void
  reset: () => void
}

export interface FilterSource {
  filters: () => UiFilter[]
  activeFilters: () => ActiveFilters
  activeSorting: () => string
  searchTerm?: () => string
  swatchColors: () => Record<string, string>
}

const copyFilters = (filters: UiFilter[]): UiFilter[] =>
  filters.map((filter) => ({
    ...filter,
    options: filter.options.map((option) => ({ ...option })),
  }))

/** A filter panel's state: a local copy of the filters that toggles at once, the sorting and search term, and the handlers that tell the shop. */
export function useFilterState(source: FilterSource, on: FilterEvents) {
  const localFilters = ref<UiFilter[]>(copyFilters(source.filters()))
  const localSorting = ref(source.activeSorting())
  const localSearch = ref(source.searchTerm?.() ?? '')
  watch(source.filters, (filters) => (localFilters.value = copyFilters(filters)), { deep: true })
  watch(source.activeSorting, (sorting) => (localSorting.value = sorting))
  if (source.searchTerm) watch(source.searchTerm, (term) => (localSearch.value = term))

  const activeCount = computed(() => activeFilterCount(localFilters.value, source.activeFilters()))
  const activeBadges = computed(() =>
    localFilters.value
      .filter((filter) => filter.type !== 'boolean' && filter.type !== 'rating')
      .flatMap((filter) =>
        filter.options
          .filter((option) => option.selected)
          .map((option) => ({
            label: option.option,
            field: filter.key,
            value: option.value,
          })),
      ),
  )
  const swatches = (filter: UiFilter) => filterSwatches(filter, source.swatchColors())
  const selectedCount = (filter: UiFilter) => filter.options.filter((option) => option.selected).length || undefined

  function toggleFilterOption(filterKey: string, optionValue: string) {
    const option = localFilters.value.find((filter) => filter.key === filterKey)?.options.find((o) => o.value === optionValue)
    if (!option) return
    option.selected = !option.selected
    if (option.selected) on.add(filterKey, optionValue)
    else on.remove(filterKey, optionValue)
  }

  function handleToggle(filterKey: string, enabled: boolean) {
    if (enabled) on.add(filterKey, true)
    else on.remove(filterKey)
  }

  function handleRating(filterKey: string, value: number) {
    if (value > 0) on.add(filterKey, { from: value })
    else on.remove(filterKey)
  }

  function handleRange(filterKey: string, value: { from?: number; to?: number }) {
    if (value.from !== undefined || value.to !== undefined) on.add(filterKey, value)
    else on.remove(filterKey)
  }

  function handleSort(value: unknown) {
    localSorting.value = String(value)
    on.sort(String(value) === 'default' ? undefined : String(value))
  }

  function handleSearch(term: string | number) {
    localSearch.value = String(term)
    on.search?.(String(term))
  }

  function removeBadge(field: string, value?: string) {
    const option = localFilters.value.find((filter) => filter.key === field)?.options.find((o) => o.value === value)
    if (option) option.selected = false
    on.remove(field, value)
  }

  function removeTags(values: unknown[]) {
    for (const badge of activeBadges.value) if (values.includes(`${badge.field}-${badge.value}`)) removeBadge(badge.field, badge.value)
  }

  function resetAll() {
    for (const filter of localFilters.value) for (const option of filter.options) option.selected = false
    localSorting.value = 'default'
    localSearch.value = ''
    on.reset()
  }

  return {
    localFilters,
    localSorting,
    localSearch,
    activeCount,
    activeBadges,
    swatches,
    selectedCount,
    toggleFilterOption,
    handleToggle,
    handleRating,
    handleRange,
    handleSort,
    handleSearch,
    removeBadge,
    removeTags,
    resetAll,
  }
}

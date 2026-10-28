<script lang="ts">
/** Shows a product list with filters in a slide-in sheet, plus sorting and search. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Product, UiFilter, UiFilterValue, UiSort } from './types'
import { computed, useId } from 'vue'
import { useFilterState } from '@library/composables/use-filter-state'
import { activeBoolean, activeRange, activeRating, DEFAULT_SWATCH_COLORS } from '@library/lib/filter-model'
import { Badge } from '@library/components/ui/badge'
import { TagGroup, TagGroupItem, TagGroupItemDelete, TagGroupItemText } from '@library/components/ui/tag-group'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@library/components/ui/empty'
import { Filter, FilterGroup, FilterList, FilterPrice, FilterRating, FilterReset, FilterSwatch, FilterSwitch } from '@library/components/ui/filter'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@library/components/ui/input-group'
import { ScrollArea } from '@library/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@library/components/ui/select'
import { Separator } from '@library/components/ui/separator'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@library/components/ui/sheet'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { ProductCardBasic } from '@library/components/sections/product-card-basic'

const props = withDefaults(
  defineProps<{
    /** The filters to offer; `type` picks the control: `boolean`, `rating`, `color`, `range` or an option list. */
    filters?: UiFilter[]
    /** Applied values by filter key for switch, rating and range filters; list options carry `selected` themselves. */
    activeFilters?: Record<string, unknown>
    /** The sort orders in the sort select. */
    sortOptions?: UiSort[]
    /** The `value` of the selected sort option. */
    activeSorting?: string
    /** The text in the search field; edits emit `update:searchTerm`. */
    searchTerm?: string
    /** Number of products matching the filters; the load-more button shows while fewer are loaded. */
    totalResults?: number
    /** Shown as the page heading, e.g. the category's name. */
    category?: string
    /** The products loaded so far, shown as cards. */
    products?: Product[]
    /** ISO 4217 code the price filter shows its range in. */
    currency?: string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    /** Builds the results count under the heading from `totalResults`. */
    resultsLabel?: (count: number) => string
    /** Shown on the button that opens the filter sheet. */
    filtersLabel?: string
    /** Shown as the filter sheet's heading. */
    sheetTitle?: string
    /** Shown in the sort select while no option is selected. */
    sortPlaceholder?: string
    /** Shown in the sheet's search field while it is empty. */
    searchPlaceholder?: string
    /** Shown on the sheet's button that clears every filter, the sorting and the search. */
    resetLabel?: string
    /** Shown next to the sort select on wider screens. */
    sortLabel?: string
    /** Builds the label of the button that closes the filter sheet from `totalResults`. */
    showResultsLabel?: (count: number) => string
    /** Builds the screen-reader name of an active filter's remove button from the option's label. */
    removeLabel?: (label: string) => string
    /** Names the list of active filters for screen readers. */
    activeFiltersLabel?: string
    /** Shown on the link next to the active filters and on the empty state's button; both clear every filter. */
    clearAllLabel?: string
    /** Shown as the heading when no product matches the filters. */
    emptyTitle?: string
    /** Shown under the heading when no product matches the filters. */
    emptyText?: string
    /** Shown on the button under the grid that loads more products. */
    loadMoreLabel?: string
    /** Swatch colour per colour-filter value, keyed lowercase. */
    swatchColors?: Record<string, string>
    class?: HTMLAttributes['class']
  }>(),
  {
    filters: () => [],
    activeFilters: () => ({}),
    sortOptions: () => [],
    activeSorting: 'default',
    searchTerm: '',
    totalResults: 0,
    category: '',
    products: () => [],
    currency: 'EUR',
    resultsLabel: (count: number) => `${count} ${count === 1 ? 'product' : 'products'}`,
    filtersLabel: 'Filters',
    sheetTitle: 'Filters',
    sortPlaceholder: 'Sort by',
    searchPlaceholder: 'Search products...',
    resetLabel: 'Reset',
    sortLabel: 'Sort by',
    showResultsLabel: (count: number) => `Show Results (${count})`,
    removeLabel: (label: string) => `Remove ${label}`,
    activeFiltersLabel: 'Active filters',
    clearAllLabel: 'Clear all',
    emptyTitle: 'No products match these filters',
    emptyText: 'Remove a filter or clear them all to see more.',
    loadMoreLabel: 'Load more',
    swatchColors: () => ({ ...DEFAULT_SWATCH_COLORS }),
  },
)

const id = useId()
// The placeholder shows when the sort matches no option; the label alone names the trigger then.
const sortShown = computed(() => props.sortOptions.some((option) => option.value === localSorting.value))
const emit = defineEmits<{
  /** Fires with the filter key and its new value when the shopper selects an option, turns on a switch or sets a range. */
  addFilter: [field: string, value: UiFilterValue]
  /** Fires with the filter key, plus the option value for a single option, when the shopper deselects or clears a filter. */
  removeFilter: [field: string, value?: string]
  /** Fires with the chosen sort key, or undefined for the default order, when the shopper changes the sorting. */
  sortResult: [sortBy?: string]
  'update:searchTerm': [term: string]
  /** Fires when the shopper resets all filters. */
  reset: []
  /** Fires when the shopper applies the filters and closes the sheet. */
  closeControl: []
  /** Fires when the shopper clicks the load-more button. */
  loadMore: []
}>()

const {
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
  removeTags,
  resetAll,
} = useFilterState(
  {
    filters: () => props.filters,
    activeFilters: () => props.activeFilters,
    activeSorting: () => props.activeSorting,
    searchTerm: () => props.searchTerm,
    swatchColors: () => props.swatchColors,
  },
  {
    add: (field, value) => emit('addFilter', field, value),
    remove: (field, value) => emit('removeFilter', field, value),
    sort: (sortBy) => emit('sortResult', sortBy),
    search: (term) => emit('update:searchTerm', term),
    reset: () => emit('reset'),
  },
)

/** Whether the filter sheet is open. */
const isOpen = defineModel<boolean>('open', { default: false })

function applyAndClose() {
  isOpen.value = false
  emit('closeControl')
}
</script>

<template>
  <div :class="['fui-filter-sheet @container', props.class]">
    <div class="container mx-auto px-4 py-6 @3xl:px-6">
      <div class="mb-6 flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
        <div>
          <h1 data-slot="title" class="fui-title">{{ category }}</h1>
          <p data-slot="hint" class="fui-hint">
            {{ resultsLabel(totalResults) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-2 @2xl:flex-none">
            <span :id="`${id}-sort-label`" data-slot="hint" class="fui-hint sr-only @2xl:not-sr-only">{{ sortLabel }}</span>
            <div class="min-w-0 flex-1 @2xl:w-45 @2xl:flex-none">
              <Select :model-value="localSorting" @update:model-value="handleSort">
                <SelectTrigger class="w-full" :aria-labelledby="sortShown ? `${id}-sort-label ${id}-sort-value` : `${id}-sort-label`">
                  <SelectValue :id="`${id}-sort-value`" :placeholder="sortPlaceholder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in sortOptions" :key="opt.key" :value="opt.value">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Sheet v-model:open="isOpen">
            <SheetTrigger as-child>
              <Button variant="outline" color="neutral">
                <IconPlaceholder
                  lucide="SlidersHorizontalIcon"
                  tabler="IconAdjustmentsHorizontal"
                  hugeicons="SlidersHorizontalIcon"
                  phosphor="SlidersHorizontalIcon"
                  remixicon="RiEqualizerLine"
                  data-icon
                />
                {{ filtersLabel }}
                <Badge v-if="activeCount > 0" size="sm" class="ms-1">{{ activeCount }}</Badge>
              </Button>
            </SheetTrigger>

            <SheetContent side="end">
              <SheetHeader>
                <SheetTitle>{{ sheetTitle }}</SheetTitle>
              </SheetHeader>

              <ScrollArea class="flex-1">
                <Filter :reset="resetAll" class="flex flex-col gap-2 px-4 py-4">
                  <InputGroup>
                    <InputGroupAddon>
                      <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon />
                    </InputGroupAddon>
                    <InputGroupInput :model-value="localSearch" :placeholder="searchPlaceholder" @update:model-value="handleSearch" />
                  </InputGroup>

                  <template v-for="filter in localFilters" :key="filter.key">
                    <FilterSwitch v-if="filter.type === 'boolean'" :value="activeBoolean(activeFilters, filter.key)" :label="filter.label" @change="handleToggle(filter.key, $event)" />
                    <FilterGroup v-else-if="filter.type === 'rating'" type="collapsible" :label="filter.label">
                      <FilterRating :value="activeRating(activeFilters, filter.key)" :max="5" @change="handleRating(filter.key, $event)" />
                    </FilterGroup>
                    <FilterGroup v-else-if="filter.type === 'color'" type="collapsible" :label="filter.label" :active-count="selectedCount(filter)" :default-open="!!selectedCount(filter)">
                      <FilterSwatch :options="swatches(filter)" @toggle="toggleFilterOption(filter.key, $event)" />
                    </FilterGroup>
                    <FilterGroup v-else-if="filter.type === 'range'" type="collapsible" :label="filter.label">
                      <FilterPrice
                        :currency="currency"
                        :locale="locale"
                        :precision="0"
                        :min="filter.data?.total.min ?? 0"
                        :max="filter.data?.total.max ?? 1000"
                        :step="10"
                        :value="{
                          from: activeRange(activeFilters, filter.key).from ?? filter.data?.total.min ?? 0,
                          to: activeRange(activeFilters, filter.key).to ?? filter.data?.total.max ?? 1000,
                        }"
                        @change="handleRange(filter.key, $event)"
                      />
                    </FilterGroup>
                    <FilterGroup v-else type="collapsible" :label="filter.label" :active-count="selectedCount(filter)" :default-open="!!selectedCount(filter)">
                      <FilterList :options="filter.options" @toggle="toggleFilterOption(filter.key, $event)" />
                    </FilterGroup>
                  </template>

                  <FilterReset :label="resetLabel" />
                </Filter>
              </ScrollArea>

              <div>
                <Separator />
                <SheetFooter class="flex-row">
                  <Button class="flex-1" @click="applyAndClose">{{ showResultsLabel(totalResults) }}</Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div v-if="activeBadges.length > 0" class="mb-6 flex flex-wrap items-center gap-2">
        <TagGroup :aria-label="activeFiltersLabel" @remove="removeTags">
          <TagGroupItem v-for="badge in activeBadges" :key="`${badge.field}-${badge.value}`" :value="`${badge.field}-${badge.value}`">
            <TagGroupItemText>{{ badge.label }}</TagGroupItemText>
            <TagGroupItemDelete :aria-label="removeLabel(badge.label)" :aria-labelledby="undefined" />
          </TagGroupItem>
        </TagGroup>
        <button type="button" data-slot="clear-link" class="fui-clear-link outline-none focus-visible:fui-focus-ring" @click="resetAll">
          {{ clearAllLabel }}
        </button>
      </div>

      <div v-if="products.length" class="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
        <ProductCardBasic v-for="(product, index) in products" :key="product.key ?? index" :product="product" :locale="locale" />
      </div>

      <Empty v-else>
        <EmptyHeader>
          <EmptyTitle>{{ emptyTitle }}</EmptyTitle>

          <EmptyDescription>{{ emptyText }}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button variant="outline" color="neutral" @click="resetAll">{{ clearAllLabel }}</Button>
        </EmptyContent>
      </Empty>

      <div v-if="products.length < totalResults" class="mt-8 flex justify-center">
        <Button variant="outline" color="neutral" @click="emit('loadMore')">{{ loadMoreLabel }}</Button>
      </div>
    </div>
  </div>
</template>

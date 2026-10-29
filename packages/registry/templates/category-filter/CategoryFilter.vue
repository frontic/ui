<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Product, UiFilter, UiFilterValue, UiSort } from './types'
import { ref } from 'vue'
import { useFilterState } from '@library/composables/use-filter-state'
import { activeBoolean, activeRange, activeRating, DEFAULT_SWATCH_COLORS } from '@library/lib/filter-model'
import { Badge } from '@library/components/ui/badge'
import { TagGroup, TagGroupItem, TagGroupItemDelete, TagGroupItemText } from '@library/components/ui/tag-group'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@library/components/ui/empty'
import { Filter, FilterGroup, FilterList, FilterPrice, FilterRating, FilterReset, FilterSwatch, FilterSwitch } from '@library/components/ui/filter'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@library/components/ui/collapsible'
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
    /** Number of products matching the filters; the load-more button shows while fewer are loaded. */
    totalResults?: number
    /** Shown as the page heading. */
    title?: string
    /** Shown under the page heading. */
    description?: string
    /** The products loaded so far, shown as cards. */
    products?: Product[]
    /** ISO 4217 code the price filter shows its range in. */
    currency?: string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    /** Builds the results count above the grid from `totalResults`. */
    resultsLabel?: (count: number) => string
    /** Shown on the button that opens the filter sheet on small screens, and as the sidebar's screen-reader heading. */
    filtersLabel?: string
    /** Shown as the filter sheet's heading. */
    sheetTitle?: string
    /** Shown in the sort select while no option is selected. */
    sortPlaceholder?: string
    /** Shown on the filter sheet's buttons that clear every filter and the sorting. */
    resetLabel?: string
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
    totalResults: 0,
    title: '',
    description: '',
    products: () => [],
    currency: 'EUR',
    resultsLabel: (count: number) => `${count} ${count === 1 ? 'result' : 'results'}`,
    filtersLabel: 'Filters',
    sheetTitle: 'Filters',
    sortPlaceholder: 'Sort by',
    resetLabel: 'Reset',
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

const emit = defineEmits<{
  /** Fires with the filter key and its new value when the shopper selects an option, turns on a switch or sets a range. */
  addFilter: [field: string, value: UiFilterValue]
  /** Fires with the filter key, plus the option value for a single option, when the shopper deselects or clears a filter. */
  removeFilter: [field: string, value?: string]
  /** Fires with the chosen sort key, or undefined for the default order, when the shopper changes the sorting. */
  sortResult: [sortBy?: string]
  /** Fires when the shopper resets all filters. */
  reset: []
  /** Fires when the shopper clicks the load-more button. */
  loadMore: []
}>()

const { localFilters, localSorting, activeCount, activeBadges, swatches, selectedCount, toggleFilterOption, handleToggle, handleRating, handleRange, handleSort, removeTags, resetAll } =
  useFilterState(
    {
      filters: () => props.filters,
      activeFilters: () => props.activeFilters,
      activeSorting: () => props.activeSorting,
      swatchColors: () => props.swatchColors,
    },
    {
      add: (field, value) => emit('addFilter', field, value),
      remove: (field, value) => emit('removeFilter', field, value),
      sort: (sortBy) => emit('sortResult', sortBy),
      reset: () => emit('reset'),
    },
  )

const mobileSheetOpen = ref(false)
</script>

<template>
  <div :class="['fui-category-filter @container', props.class]">
    <div>
      <div class="px-4 py-12 @2xl:px-6 @5xl:px-8">
        <div class="mx-auto max-w-7xl">
          <h1 data-slot="category-filter-heading" class="fui-category-filter-heading">
            {{ title }}
          </h1>
          <p data-slot="category-filter-description" class="fui-category-filter-description">
            {{ description }}
          </p>
        </div>
      </div>
      <Separator />
    </div>

    <div class="mx-auto max-w-7xl px-4 @2xl:px-6 @5xl:px-8">
      <div>
        <div class="flex items-center justify-between py-4">
          <p data-slot="hint" class="fui-hint">
            {{ resultsLabel(totalResults) }}
          </p>

          <div class="flex items-center gap-3">
            <div class="hidden items-center gap-2 @2xl:flex">
              <div class="w-42.5 shrink-0">
                <Select :model-value="localSorting" @update:model-value="handleSort">
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="sortPlaceholder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in sortOptions" :key="opt.key" :value="opt.value">{{ opt.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Sheet v-model:open="mobileSheetOpen">
              <SheetTrigger as-child>
                <Button variant="outline" color="neutral" size="sm" class="@5xl:hidden">
                  <IconPlaceholder
                    lucide="SlidersHorizontalIcon"
                    tabler="IconAdjustmentsHorizontal"
                    hugeicons="SlidersHorizontalIcon"
                    phosphor="SlidersHorizontalIcon"
                    remixicon="RiEqualizerLine"
                    data-icon
                  />
                  {{ filtersLabel }}
                  <Badge v-if="activeCount > 0" size="sm" class="ms-0.5">{{ activeCount }}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="end">
                <SheetHeader>
                  <SheetTitle>{{ sheetTitle }}</SheetTitle>
                </SheetHeader>
                <ScrollArea class="flex-1">
                  <Filter :reset="resetAll" class="flex flex-col gap-2 px-4 py-4">
                    <Select :model-value="localSorting" @update:model-value="handleSort">
                      <SelectTrigger class="w-full">
                        <SelectValue :placeholder="sortPlaceholder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in sortOptions" :key="opt.key" :value="opt.value">{{ opt.label }}</SelectItem>
                      </SelectContent>
                    </Select>

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
                    <Button variant="outline" color="neutral" class="flex-1" :disabled="activeCount === 0" @click="resetAll">{{ resetLabel }}</Button>
                    <Button class="flex-1" @click="mobileSheetOpen = false">{{ showResultsLabel(totalResults) }}</Button>
                  </SheetFooter>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Separator />
      </div>

      <div v-if="activeBadges.length > 0">
        <div class="flex flex-wrap items-center gap-2 py-3">
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
        <Separator />
      </div>

      <div class="pt-8 pb-16 @5xl:grid @5xl:grid-cols-4 @5xl:gap-x-8">
        <aside class="hidden @5xl:block">
          <h2 class="sr-only">{{ filtersLabel }}</h2>
          <Filter :reset="resetAll">
            <template v-for="(filter, index) in localFilters" :key="filter.key">
              <Separator v-if="index > 0" />
              <div v-if="filter.type === 'boolean'" class="py-6 first:pt-0 last:pb-0">
                <FilterSwitch :value="activeBoolean(activeFilters, filter.key)" :label="filter.label" @change="handleToggle(filter.key, $event)" />
              </div>
              <Collapsible v-else :default-open="true" class="py-6 first:pt-0 last:pb-0">
                <CollapsibleTrigger as-child>
                  <button type="button" data-slot="part-title" class="fui-part-title group flex w-full items-center justify-between">
                    <span class="flex items-center gap-2">
                      {{ filter.label }}
                      <Badge v-if="selectedCount(filter) && filter.type !== 'rating' && filter.type !== 'range'" size="sm">{{ selectedCount(filter) }}</Badge>
                    </span>
                    <span data-slot="hint" class="fui-hint flex">
                      <IconPlaceholder
                        lucide="ChevronDownIcon"
                        tabler="IconChevronDown"
                        hugeicons="ArrowDown01Icon"
                        phosphor="CaretDownIcon"
                        remixicon="RiArrowDownSLine"
                        class="size-4 transition-transform group-aria-expanded:rotate-180"
                      />
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent class="pt-4">
                  <FilterRating v-if="filter.type === 'rating'" :value="activeRating(activeFilters, filter.key)" :max="5" @change="handleRating(filter.key, $event)" />
                  <FilterSwatch v-else-if="filter.type === 'color'" :options="swatches(filter)" :aria-label="filter.label" @toggle="toggleFilterOption(filter.key, $event)" />
                  <FilterPrice
                    v-else-if="filter.type === 'range'"
                    :aria-label="filter.label"
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
                  <FilterList v-else :options="filter.options" :aria-label="filter.label" @toggle="toggleFilterOption(filter.key, $event)" />
                </CollapsibleContent>
              </Collapsible>
            </template>
          </Filter>
        </aside>

        <div class="mt-6 @5xl:col-span-3 @5xl:mt-0">
          <div v-if="products.length" class="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
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

          <div v-if="products.length < totalResults" class="mt-10 flex justify-center">
            <Button variant="outline" color="neutral" @click="emit('loadMore')">{{ loadMoreLabel }}</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

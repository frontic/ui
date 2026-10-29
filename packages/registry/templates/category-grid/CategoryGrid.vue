<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { GridCrumb, GridHeader, Product, UiFilter, UiFilterValue, UiSort } from './types'
import { computed, ref } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import { activeBoolean, activeFilterCount, activeRange, activeRating, DEFAULT_SWATCH_COLORS, filterSwatches } from '@library/lib/filter-model'
import { pageRange } from '@library/lib/text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@library/components/ui/accordion'
import { Badge } from '@library/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@library/components/ui/breadcrumb'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@library/components/ui/empty'
import { Filter, FilterList, FilterPrice, FilterRating, FilterSwatch, FilterSwitch } from '@library/components/ui/filter'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from '@library/components/ui/pagination'
import { ScrollArea } from '@library/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@library/components/ui/select'
import { Separator } from '@library/components/ui/separator'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@library/components/ui/sheet'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { HeaderShop } from '@library/components/templates/header-shop'
import { ProductCardGallery } from '@library/components/sections/product-card-gallery'

const props = withDefaults(
  defineProps<{
    /** Props for the HeaderShop above the page; the `header` slot replaces it. */
    header?: GridHeader
    /** The trail above the heading; the last crumb shows as the current page. */
    breadcrumbs?: GridCrumb[]
    /** Shown as the page heading. */
    title?: string
    /** Shown under the page heading; hidden when empty. */
    description?: string
    /** The current page's products, shown as cards. */
    products?: Product[]
    /** Number of products matching the filters; sets the page count and the results labels. */
    totalResults?: number
    /** Products per page; sets the page count and the range shown under the grid. */
    perPage?: number
    /** The filters to offer; `type` picks the control: `boolean`, `rating`, `color`, `range` or an option list. */
    filters?: UiFilter[]
    /** Applied values by filter key for switch, rating and range filters; list options carry `selected` themselves. */
    activeFilters?: Record<string, unknown>
    /** The sort orders in the sort select. */
    sortOptions?: UiSort[]
    /** The `value` of the selected sort option. */
    activeSorting?: string
    /** Swatch colour per colour-filter value, keyed lowercase; values without one show grey. */
    swatchColors?: Record<string, string>
    /** ISO 4217 code the price filter shows its range in. */
    currency?: string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    /** Builds the results count next to the sort select from `totalResults`. */
    resultsLabel?: (count: number) => string
    /** Builds the line under the grid from the first and last product shown and `totalResults`. */
    rangeLabel?: (from: number, to: number, total: number) => string
    /** Shown in the sort select while no option is selected. */
    sortPlaceholder?: string
    /** Shown on the button that opens the filter sheet on small screens, and as the sheet's heading. */
    filtersLabel?: string
    /** Builds the label of the button that closes the filter sheet from `totalResults`. */
    showResultsLabel?: (count: number) => string
    /** Shown on the link next to the active filters and on the empty state's button; both clear every filter. */
    clearAllLabel?: string
    /** Builds the screen-reader name of an active filter's remove button from the option's label. */
    removeLabel?: (label: string) => string
    /** Shown as the heading when no product matches the filters. */
    emptyTitle?: string
    /** Shown under the heading when no product matches the filters. */
    emptyText?: string
    /** Shown on the pagination's previous-page button. */
    previousLabel?: string
    /** Shown on the pagination's next-page button. */
    nextLabel?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    header: () => ({}),
    breadcrumbs: () => [],
    title: '',
    description: '',
    products: () => [],
    totalResults: 0,
    perPage: 12,
    filters: () => [],
    activeFilters: () => ({}),
    sortOptions: () => [],
    activeSorting: 'default',
    swatchColors: () => ({ ...DEFAULT_SWATCH_COLORS }),
    currency: 'EUR',
    resultsLabel: (count: number) => `${count} ${count === 1 ? 'product' : 'products'}`,
    rangeLabel: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} ${total === 1 ? 'product' : 'products'}`,
    sortPlaceholder: 'Sort by',
    filtersLabel: 'Filters',
    showResultsLabel: (count: number) => `Show ${count} ${count === 1 ? 'product' : 'products'}`,
    clearAllLabel: 'Clear all',
    removeLabel: (label: string) => `Remove ${label}`,
    emptyTitle: 'No products match these filters',
    emptyText: 'Remove a filter or clear them all to see more.',
    previousLabel: 'Previous',
    nextLabel: 'Next',
  },
)

/** The page of results on show, from 1. */
const page = defineModel<number>('page', { default: 1 })

const emit = defineEmits<{
  /** Fires with the filter key and its new value when the shopper selects an option, turns on a switch or sets a range. */
  addFilter: [field: string, value: UiFilterValue]
  /** Fires with the filter key, plus the option value for a single option, when the shopper deselects or clears a filter. */
  removeFilter: [field: string, value?: string]
  /** Fires with the chosen sort key, or undefined for the default order, when the shopper changes the sorting. */
  sortResult: [sortBy?: string]
  /** Fires when the shopper resets all filters. */
  reset: []
}>()

defineSlots<{
  /** Replaces the shop header above the grid. */
  header?: () => unknown
}>()

const [DefineFilters, ReuseFilters] = createReusableTemplate()
const sheetOpen = ref(false)

const collapsible = computed(() => props.filters.filter((f) => f.type !== 'boolean'))
const switches = computed(() => props.filters.filter((f) => f.type === 'boolean'))
const opened = ref(collapsible.value.filter((f, i) => i < 2 || f.options.some((o) => o.selected)).map((f) => f.key))

const selectedCount = (filter: UiFilter) => filter.options.filter((o) => o.selected).length || undefined
const swatches = (filter: UiFilter) => filterSwatches(filter, props.swatchColors)

function rangeValue(filter: UiFilter) {
  const range = activeRange(props.activeFilters, filter.key)
  return {
    from: range.from ?? filter.data?.total.min ?? 0,
    to: range.to ?? filter.data?.total.max ?? 1000,
  }
}

const activeSwitch = (filter: UiFilter) => activeBoolean(props.activeFilters, filter.key)

const chips = computed(() => [
  ...props.filters
    .filter((f) => f.type !== 'boolean' && f.type !== 'rating' && f.type !== 'range')
    .flatMap((f) =>
      f.options
        .filter((o) => o.selected)
        .map((o) => ({
          label: o.option,
          field: f.key,
          value: o.value as string | undefined,
        })),
    ),
  ...switches.value.filter(activeSwitch).map((f) => ({ label: f.label, field: f.key, value: undefined })),
])
const activeCount = computed(() => activeFilterCount(props.filters, props.activeFilters))

const pages = computed(() => Math.max(1, Math.ceil(props.totalResults / props.perPage)))
const shown = computed(() => pageRange(page.value, props.perPage, props.totalResults))

function changed() {
  page.value = 1
}

function toggle(filter: UiFilter, value: string) {
  const option = filter.options.find((o) => o.value === value)
  if (option?.selected) emit('removeFilter', filter.key, value)
  else emit('addFilter', filter.key, value)
  changed()
}

function set(filter: UiFilter, value: UiFilterValue | undefined) {
  if (value === undefined) emit('removeFilter', filter.key)
  else emit('addFilter', filter.key, value)
  changed()
}

function remove(field: string, value?: string) {
  emit('removeFilter', field, value)
  changed()
}

function sort(value: unknown) {
  emit('sortResult', String(value) === 'default' ? undefined : String(value))
  changed()
}

function reset() {
  emit('reset')
  changed()
}
</script>

<template>
  <div :class="['fui-category-grid @container', props.class]">
    <DefineFilters>
      <div class="flex flex-col gap-4">
        <div v-if="chips.length" class="flex flex-wrap items-center gap-2">
          <Badge v-for="chip in chips" :key="`${chip.field}-${chip.value}`" variant="primary">
            {{ chip.label }}
            <button
              type="button"
              data-slot="category-grid-dismiss"
              class="fui-category-grid-dismiss inline-flex shrink-0 items-center justify-center outline-none focus-visible:fui-focus-ring"
              :aria-label="removeLabel(chip.label)"
              @click="remove(chip.field, chip.value)"
            >
              <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" class="size-3" />
            </button>
          </Badge>
          <button type="button" data-slot="clear-link" class="fui-clear-link outline-none focus-visible:fui-focus-ring" @click="reset">
            {{ clearAllLabel }}
          </button>
        </div>
        <Filter :reset="reset">
          <Accordion v-model="opened" type="multiple">
            <AccordionItem v-for="filter in collapsible" :key="filter.key" :value="filter.key">
              <AccordionTrigger>
                <span class="flex flex-1 items-center gap-2">
                  {{ filter.label }}
                  <Badge v-if="selectedCount(filter)" variant="primary" size="sm">{{ selectedCount(filter) }}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <FilterPrice
                  v-if="filter.type === 'range'"
                  :aria-label="filter.label"
                  :currency="currency"
                  :locale="locale"
                  :precision="0"
                  :min="filter.data?.total.min ?? 0"
                  :max="filter.data?.total.max ?? 1000"
                  :step="10"
                  :value="rangeValue(filter)"
                  @change="set(filter, $event)"
                />
                <FilterRating v-else-if="filter.type === 'rating'" :value="activeRating(activeFilters, filter.key)" :max="5" @change="set(filter, $event > 0 ? { from: $event } : undefined)" />
                <FilterSwatch v-else-if="filter.type === 'color'" :options="swatches(filter)" :aria-label="filter.label" @toggle="toggle(filter, $event)" />
                <FilterList v-else :options="filter.options" :aria-label="filter.label" @toggle="toggle(filter, $event)" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <FilterSwitch v-for="filter in switches" :key="filter.key" class="pt-4" :value="activeSwitch(filter)" :label="filter.label" @change="set(filter, $event || undefined)" />
        </Filter>
      </div>
    </DefineFilters>

    <div class="relative">
      <slot name="header">
        <HeaderShop v-bind="header" />
      </slot>
    </div>

    <div class="mx-auto flex w-full max-w-384 flex-col gap-5 px-4 pt-5 pb-8 @2xl:px-6 @5xl:px-8">
      <Breadcrumb v-if="breadcrumbs.length">
        <BreadcrumbList>
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label">
            <BreadcrumbSeparator v-if="index > 0" />
            <BreadcrumbItem>
              <BreadcrumbPage v-if="index === breadcrumbs.length - 1">{{ crumb.label }}</BreadcrumbPage>
              <BreadcrumbLink v-else :href="crumb.href">{{ crumb.label }}</BreadcrumbLink>
            </BreadcrumbItem>
          </template>
        </BreadcrumbList>
      </Breadcrumb>

      <div class="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:gap-8">
        <div class="flex max-w-2xl flex-col gap-2">
          <h1 data-slot="category-grid-heading" class="fui-category-grid-heading">
            {{ title }}
          </h1>
          <p v-if="description" data-slot="category-grid-description" class="fui-category-grid-description">
            {{ description }}
          </p>
        </div>
        <div class="flex shrink-0 items-center justify-between gap-3">
          <Sheet v-model:open="sheetOpen">
            <SheetTrigger as-child>
              <Button variant="outline" color="neutral" class="@3xl:hidden">
                <IconPlaceholder
                  lucide="SlidersHorizontalIcon"
                  tabler="IconAdjustmentsHorizontal"
                  hugeicons="SlidersHorizontalIcon"
                  phosphor="SlidersHorizontalIcon"
                  remixicon="RiEqualizerLine"
                  data-icon
                />
                {{ filtersLabel }}
                <Badge v-if="activeCount" size="sm">{{ activeCount }}</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" class="max-h-17/20">
              <SheetHeader>
                <SheetTitle>{{ filtersLabel }}</SheetTitle>
              </SheetHeader>
              <ScrollArea class="min-h-0 flex-1">
                <div class="px-4 pb-4">
                  <ReuseFilters />
                </div>
              </ScrollArea>
              <SheetFooter>
                <Button @click="sheetOpen = false">{{ showResultsLabel(totalResults) }}</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div class="flex items-center gap-3">
            <span class="hidden @md:inline">
              <span data-slot="hint" class="fui-hint">{{ resultsLabel(totalResults) }}</span>
            </span>
            <Select :model-value="activeSorting" @update:model-value="sort">
              <SelectTrigger class="w-44">
                <SelectValue :placeholder="sortPlaceholder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in sortOptions" :key="option.key" :value="option.value">{{ option.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div class="flex gap-10">
        <aside class="hidden w-64 shrink-0 @3xl:block">
          <ReuseFilters />
        </aside>

        <div class="@container flex min-w-0 flex-1 flex-col gap-8">
          <div v-if="products.length" class="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3 @2xl:gap-6 @6xl:grid-cols-4">
            <ProductCardGallery v-for="(product, index) in products" :key="product.key ?? index" :product="product" :locale="locale" />
          </div>
          <Empty v-else>
            <EmptyHeader>
              <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
              <EmptyDescription>{{ emptyText }}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" color="neutral" @click="reset">{{ clearAllLabel }}</Button>
            </EmptyContent>
          </Empty>

          <div v-if="products.length" class="flex flex-col items-center gap-4 @2xl:flex-row @2xl:justify-between">
            <span v-if="shown" class="shrink-0">
              <span data-slot="hint" class="fui-hint">{{ rangeLabel(shown.from, Math.min(shown.to, shown.from + products.length - 1), totalResults) }}</span>
            </span>
            <Pagination v-if="pages > 1" v-model:page="page" :items-per-page="perPage" :total="totalResults" class="mx-0 @2xl:justify-end">
              <PaginationContent v-slot="{ items }">
                <PaginationPrevious :label="previousLabel" />
                <template v-for="(item, index) in items" :key="index">
                  <PaginationItem v-if="item.type === 'page'" :value="item.value">{{ item.value }}</PaginationItem>
                  <PaginationEllipsis v-else :index="index" />
                </template>
                <PaginationNext :label="nextLabel" />
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

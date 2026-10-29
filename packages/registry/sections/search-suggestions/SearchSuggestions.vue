<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { SearchCollection, SearchResult, SearchSuggestion } from './types'
import { createReusableTemplate, onKeyStroke } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  Search,
  SearchEmpty,
  SearchGroup,
  SearchHighlight,
  SearchInput,
  SearchItem,
  SearchLoading,
  SearchOverlay,
  SearchOverlayTrigger,
  SearchQuery,
  SearchResults,
  SearchTag,
} from '@library/components/ui/search'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** The shop's answer to the query; shown only while it answers the query in the field. */
    results?: SearchResult | null
    /** Shows the loading rows while the shop's search runs. */
    loading?: boolean
    /** Searches offered as tags before typing and when nothing is found. */
    suggestions?: SearchSuggestion[]
    /** Curated rows of products, such as staff picks, shown before typing and when nothing is found. */
    collections?: SearchCollection[]
    /** What counts as a match in the names: the typed query when left out, or the terms the shop's search matched. */
    highlight?: string | string[]
    /** Inline floats the panel under the field; overlay shows a search button that opens it full screen on phones and near the top on wide screens. */
    presentation?: 'inline' | 'overlay'
    /** The results page for a query; links the suggestion tags and the "See all" row. Without it, tags run in the panel. */
    searchHref?: (query: string) => string
    /** Lets "/" focus the field, or open the overlay, while focus is not in another field. */
    shortcut?: boolean
    /** Shown in the empty field. */
    placeholder?: string
    /** Screen-reader name of the field and of the overlay's search button. */
    searchLabel?: string
    /** The heading over the products. */
    productsLabel?: string
    /** The heading over the categories. */
    categoriesLabel?: string
    /** The heading over the brands. */
    brandsLabel?: string
    /** The heading over the suggested searches before typing. */
    popularLabel?: string
    /** Builds the line shown when a search finds nothing. */
    noResultsLabel?: (query: string) => string
    /** Builds the "See all" row from the total; it shows when the total is more than the products listed. */
    seeAllLabel?: (total: number) => string
    /** Builds what screen readers hear when results land. */
    resultsAnnouncement?: (count: number) => string
    /** The overlay's Cancel button on phones. */
    cancelLabel?: string
    /** The products' price locale, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    results: null,
    loading: false,
    suggestions: () => [],
    collections: () => [],
    highlight: undefined,
    presentation: 'inline',
    searchHref: undefined,
    shortcut: false,
    placeholder: 'Search',
    searchLabel: 'Search',
    productsLabel: 'Products',
    categoriesLabel: 'Categories',
    brandsLabel: 'Brands',
    popularLabel: 'Popular searches',
    noResultsLabel: (query: string) => `No results for "${query}". Try one of these:`,
    seeAllLabel: (total: number) => `See all ${total} results`,
    resultsAnnouncement: (count: number) => (count === 1 ? '1 result' : `${count} results`),
    cancelLabel: 'Cancel',
    locale: undefined,
  },
)

/** What the shopper typed; run the shop's search on every change. */
const query = defineModel<string>('query', { default: '' })
/** Whether the panel is open, or the overlay in that presentation. */
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** The shopper asked for every result for the query. */
  submit: [query: string]
  /** The shopper opened a row; gets its `href`, which the link also follows. */
  select: [href: string]
}>()

const typed = computed(() => query.value.trim())
/** Results for an older query wait, as if still loading, so a late answer never shows under a newer query. */
const current = computed(() => (props.results && props.results.query === typed.value ? props.results : null))
const waiting = computed(() => !!typed.value && (props.loading || !current.value))
const found = computed(() => (current.value ? current.value.products.length + current.value.categories.length + current.value.brands.length : 0))
const empty = computed(() => !typed.value || (!!current.value && !found.value))
const tags = computed(() => props.suggestions.map((suggestion) => ({ label: suggestion.label, query: suggestion.query ?? suggestion.label })))
const terms = computed(() => props.highlight ?? typed.value)

// Rows need values unique across the panel, so picks and "See all" carry a prefix; `select` gets the row's href.
const hrefs = computed(() => {
  const rows = new Map<string, string>()
  for (const collection of props.collections) for (const item of collection.products) rows.set(`pick:${collection.title}:${item.href}`, item.href)
  if (current.value?.total && props.searchHref) rows.set(`see-all:${typed.value}`, props.searchHref(typed.value))
  return rows
})
const onSelect = (value: unknown) => emit('select', hrefs.value.get(String(value)) ?? String(value))

const root = useTemplateRef<HTMLElement>('root')
onKeyStroke('/', (event) => {
  if (!props.shortcut || event.metaKey || event.ctrlKey || event.altKey || !root.value?.offsetParent) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return
  event.preventDefault()
  if (props.presentation === 'overlay') open.value = true
  else root.value.querySelector('input')?.focus()
})

const announce = computed(() => (current.value && !props.loading ? props.resultsAnnouncement(found.value) : ''))

const [DefineSearch, ReuseSearch] = createReusableTemplate()
</script>

<template>
  <DefineSearch>
    <Search
      v-model:query="query"
      v-model:open="open"
      :loading="waiting"
      :class="props.presentation === 'overlay' && 'flex min-h-0 flex-1 flex-col'"
      @submit="emit('submit', $event)"
      @select="onSelect"
    >
      <SearchInput :placeholder="props.placeholder" :label="props.searchLabel" />
      <SearchResults :position="props.presentation === 'overlay' ? 'inline' : 'popper'" :class="props.presentation === 'inline' && '@2xl:min-w-md'">
        <span role="status" class="sr-only">{{ announce }}</span>
        <SearchQuery />
        <SearchLoading />

        <template v-if="current && found && !props.loading">
          <SearchGroup v-if="current.products.length" :heading="props.productsLabel">
            <SearchItem v-for="item in current.products" :key="item.href" :value="item.href" :href="item.href">
              <Image :src="item.image ?? '/placeholder.svg'" alt="" data-slot="search-suggestions-image" class="fui-search-suggestions-image shrink-0 object-cover" />
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <SearchHighlight data-slot="line-title" class="fui-line-title truncate" :text="item.name" :terms="terms" />
                <span v-if="item.meta" data-slot="meta" class="fui-meta truncate">{{ item.meta }}</span>
              </span>
              <span class="flex shrink-0 flex-col items-end gap-1">
                <Badge v-if="item.badge" :variant="item.badge.variant" size="sm">{{ item.badge.label }}</Badge>
                <Price :price="item.price" :locale="props.locale" size="sm" align="end" show-ref :show-discount="false" />
              </span>
            </SearchItem>
          </SearchGroup>
          <SearchGroup v-if="current.categories.length" :heading="props.categoriesLabel">
            <SearchItem v-for="item in current.categories" :key="item.href" :value="item.href" :href="item.href">
              <SearchHighlight class="flex-1" :text="item.name" :terms="terms" />
              <span v-if="item.count !== undefined" data-slot="meta" class="fui-meta tabular-nums">{{ item.count }}</span>
            </SearchItem>
          </SearchGroup>
          <SearchGroup v-if="current.brands.length" :heading="props.brandsLabel">
            <SearchItem v-for="item in current.brands" :key="item.href" :value="item.href" :href="item.href">
              <SearchHighlight :text="item.name" :terms="terms" />
            </SearchItem>
          </SearchGroup>
          <SearchItem v-if="current.total && current.total > current.products.length && props.searchHref" :value="`see-all:${typed}`" :href="props.searchHref(typed)">
            {{ props.seeAllLabel(current.total) }}
          </SearchItem>
        </template>

        <template v-if="empty && !waiting">
          <SearchEmpty v-if="typed">{{ props.noResultsLabel(typed) }}</SearchEmpty>
          <SearchGroup v-if="tags.length" :heading="typed ? undefined : props.popularLabel">
            <div class="flex flex-wrap gap-2 px-3 pb-2">
              <SearchTag v-for="tag in tags" :key="tag.query" :query="tag.query" :href="props.searchHref?.(tag.query)">{{ tag.label }}</SearchTag>
            </div>
          </SearchGroup>
          <SearchGroup v-for="collection in props.collections" :key="collection.title" :heading="collection.title">
            <div class="@container">
              <div data-slot="search-suggestions-picks" class="flex gap-3 overflow-x-auto px-3 pb-2 [&>*]:w-2/5 [&>*]:shrink-0 @sm:[&>*]:w-auto @sm:[&>*]:min-w-0 @sm:[&>*]:flex-1">
                <SearchItem
                  v-for="item in collection.products"
                  :key="item.href"
                  :value="`pick:${collection.title}:${item.href}`"
                  :href="item.href"
                  data-slot="search-suggestions-pick"
                  class="fui-search-suggestions-pick flex-col items-stretch"
                >
                  <Image :src="item.image ?? '/placeholder.svg'" alt="" class="aspect-square w-full object-cover" />
                  <span data-slot="line-title" class="fui-line-title line-clamp-2 hyphens-auto wrap-break-word">{{ item.name }}</span>
                  <Price :price="item.price" :locale="props.locale" size="sm" show-ref :show-discount="false" />
                </SearchItem>
              </div>
            </div>
          </SearchGroup>
        </template>
      </SearchResults>
    </Search>
  </DefineSearch>

  <div ref="root" data-slot="search-suggestions" :class="props.class">
    <template v-if="props.presentation === 'overlay'">
      <SearchOverlay v-model:open="open" :title="props.searchLabel" :cancel-label="props.cancelLabel">
        <template #trigger>
          <SearchOverlayTrigger as-child>
            <Button variant="ghost" color="neutral" size="icon-md" :aria-label="props.searchLabel">
              <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon />
            </Button>
          </SearchOverlayTrigger>
        </template>
        <ReuseSearch />
      </SearchOverlay>
    </template>
    <ReuseSearch v-else />
  </div>
</template>

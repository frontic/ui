<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** The first row while the shopper types: "Search for …", which submits the query to the results page. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ComboboxItem } from 'reka-ui'
import { inject } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { searchContext } from './keys'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown before the quoted query. */
    label?: string
  }>(),
  { label: 'Search for' },
)

defineSlots<{
  /** Replaces the row's text; gets the trimmed query. */
  default?: (props: { query: string }) => unknown
}>()

const search = inject(searchContext)!

function onSelect(event: Event) {
  event.preventDefault()
  search.submit()
}
</script>

<template>
  <ComboboxItem
    v-if="search.query.value.trim()"
    data-slot="search-query"
    :value="`search-query:${search.query.value.trim()}`"
    :class="['fui-search-query cursor-default outline-hidden select-none **:data-icon:shrink-0', props.class]"
    @select="onSelect"
  >
    <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon />
    <span class="min-w-0 truncate">
      <slot :query="search.query.value.trim()"
        >{{ props.label }} "<b class="fui-search-query-term">{{ search.query.value.trim() }}</b
        >"</slot
      >
    </span>
  </ComboboxItem>
</template>

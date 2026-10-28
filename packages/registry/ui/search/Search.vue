<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups all parts of the search: a field whose panel offers results, suggestions and a "Search for" row. */
export default {}
</script>

<script setup lang="ts">
import { ComboboxRoot } from 'reka-ui'
import { inject, nextTick, provide, toRef, useTemplateRef } from 'vue'
import { searchContext, searchOverlay } from './keys'

const props = withDefaults(
  defineProps<{
    /** Shows the loading rows and keeps the "Search for" row usable. */
    loading?: boolean
    /** Opens the panel when the field gets focus, so suggestions show before typing. */
    openOnFocus?: boolean
    /** Wraps the arrow keys from the last row to the first. */
    loop?: boolean
  }>(),
  { loading: false, openOnFocus: true, loop: true },
)
const emits = defineEmits<{
  /** The shopper asked for every result for the query: Enter on the "Search for" row. */
  submit: [query: string]
  /** The shopper opened a result or card; a link navigates by itself. */
  select: [value: unknown]
}>()

/** What the shopper typed; the shop runs its search on every change. */
const query = defineModel<string>('query', { default: '' })
/** Whether the panel is open. */
const open = defineModel<boolean>('open', { default: false })

defineSlots<{
  /** Holds the input and the results panel; gets the query and whether the panel is open. */
  default?: (props: { query: string; open: boolean }) => unknown
}>()

// Inside an overlay the panel is the overlay's body, so it stays open until the overlay closes.
const overlay = inject(searchOverlay, null)

const root = useTemplateRef<{ highlightFirstItem?: () => void }>('root')

provide(searchContext, {
  query,
  loading: toRef(props, 'loading'),
  submit: () => {
    if (!query.value.trim()) return
    open.value = false
    overlay?.close()
    emits('submit', query.value.trim())
  },
  run: (next) => {
    query.value = next
    void nextTick(() => root.value?.highlightFirstItem?.())
  },
  close: () => {
    open.value = false
    overlay?.close()
  },
  select: (value) => {
    open.value = false
    overlay?.close()
    emits('select', value)
  },
})
</script>

<template>
  <ComboboxRoot
    ref="root"
    :open="overlay ? true : open"
    @update:open="(next: boolean) => (open = next)"
    data-slot="search"
    ignore-filter
    :reset-search-term-on-blur="false"
    :reset-search-term-on-select="false"
    :open-on-focus="props.openOnFocus"
    :loop="props.loop"
    highlight-on-hover
    class="relative"
  >
    <slot :query="query" :open="overlay ? true : open" />
  </ComboboxRoot>
</template>

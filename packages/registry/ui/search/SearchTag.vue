<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** A suggested search, drawn as a tag; opening it runs that search. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ComboboxItem } from 'reka-ui'
import { inject } from 'vue'
import { searchContext } from './keys'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** The search the tag runs. */
  query: string
  /** The results page for the query, which the tag opens as a link; without one, the tag puts the query in the field. */
  href?: string
}>()

const search = inject(searchContext)!

function onSelect(event: Event) {
  event.preventDefault()
  if (props.href) search.close()
  else search.run(props.query)
}
</script>

<template>
  <ComboboxItem
    data-slot="search-tag"
    :value="`search-tag:${props.query}`"
    :text-value="props.query"
    :as="props.href ? 'a' : 'div'"
    :href="props.href"
    :class="['fui-search-tag cursor-default whitespace-nowrap outline-hidden select-none', props.class]"
    @select="onSelect"
  >
    <slot>{{ props.query }}</slot>
  </ComboboxItem>
</template>

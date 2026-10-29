<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ComboboxItem } from 'reka-ui'
import { inject } from 'vue'
import { searchContext } from './keys'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** Identifies the row; Search emits it with `select`. */
  value: AcceptableValue
  /** Where the row leads; without one it renders a div and only emits `select`. */
  href?: string
  /** Greys the row out; the arrow keys skip it. */
  disabled?: boolean
}>()

const search = inject(searchContext)!

function onSelect(event: Event) {
  event.preventDefault()
  search.select(props.value)
}
</script>

<template>
  <ComboboxItem
    data-slot="search-item"
    :value="props.value"
    :disabled="props.disabled"
    :as="props.href ? 'a' : 'div'"
    :href="props.href"
    :class="['fui-search-item cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:shrink-0', props.class]"
    @select="onSelect"
  >
    <slot />
  </ComboboxItem>
</template>

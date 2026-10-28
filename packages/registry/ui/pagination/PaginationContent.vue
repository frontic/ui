<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lists the page numbers, ellipses and navigation buttons of the pagination. */
export default {}
</script>

<script setup lang="ts">
import type { PaginationListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationList, useForwardProps } from 'reka-ui'

const props = defineProps<PaginationListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

defineSlots<{
  /** Holds the page buttons; gets the items to render, each a page with its number or an ellipsis. */
  default?: (props: { items: ({ type: 'ellipsis' } | { type: 'page'; value: number })[] }) => unknown
}>()
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationList v-slot="slotProps" data-slot="pagination-content" v-bind="forwarded" :class="['fui-pagination-content', props.class]">
    <slot v-bind="slotProps" />
  </PaginationList>
</template>

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

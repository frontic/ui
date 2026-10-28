<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows the scroll position and lets the user drag to scroll. */
export default {}
</script>

<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { ScrollAreaScrollbar, ScrollAreaThumb, useForwardProps } from 'reka-ui'

const props = withDefaults(defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }>(), {
  orientation: 'vertical',
})

const delegatedProps = reactiveOmit(props, 'class')

const scrollbar = cva('fui-scroll-area-scrollbar touch-none transition-colors select-none', {
  variants: {
    orientation: {
      vertical: 'fui-scroll-area-scrollbar-vertical',
      horizontal: 'fui-scroll-area-scrollbar-horizontal',
    },
  },
  defaultVariants: { orientation: 'vertical' },
})
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ScrollAreaScrollbar data-slot="scroll-area-scrollbar" :data-orientation="props.orientation" v-bind="forwarded" :class="[scrollbar({ orientation: props.orientation }), props.class]">
    <ScrollAreaThumb data-slot="scroll-area-thumb" class="fui-scroll-area-thumb relative flex-1" />
  </ScrollAreaScrollbar>
</template>

<script lang="ts">
/** Holds the slides of the carousel in a scrollable row. */
export default {}
</script>

<script setup lang="ts">
import type { WithClassAsProps } from './interface'
import { cva } from 'class-variance-authority'
import { useCarousel } from './useCarousel'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<WithClassAsProps>()

const { carouselRef, orientation } = useCarousel()

const carouselContent = cva('fui-carousel-content', {
  variants: { orientation: { horizontal: 'fui-carousel-content-horizontal', vertical: 'fui-carousel-content-vertical' } },
  defaultVariants: { orientation: 'horizontal' },
})
</script>

<template>
  <div ref="carouselRef" data-slot="carousel-content" class="overflow-hidden">
    <div :class="[carouselContent({ orientation }), 'touch-pinch-zoom', orientation === 'horizontal' ? 'touch-pan-y' : 'touch-pan-x', props.class]" v-bind="$attrs">
      <slot />
    </div>
  </div>
</template>

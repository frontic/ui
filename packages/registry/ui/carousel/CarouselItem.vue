<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import type { WithClassAsProps } from './interface'
import { computed, useTemplateRef } from 'vue'
import { useCarousel } from './useCarousel'

const props = withDefaults(
  defineProps<
    PrimitiveProps &
      WithClassAsProps & {
        /** Screen-reader name for each slide, announced as e.g. `slide`. */
        roleDescription?: string
        /** Builds the slide's screen-reader label from its 1-based position and the slide count, e.g. `2 of 6`. */
        label?: (slide: number, total: number) => string
      }
  >(),
  { as: 'div', roleDescription: 'slide', label: (slide: number, total: number) => `${slide} of ${total}` },
)

const { orientation, slides } = useCarousel()

const carouselItem = cva('fui-carousel-item', {
  variants: { orientation: { horizontal: 'fui-carousel-item-horizontal', vertical: 'fui-carousel-item-vertical' } },
  defaultVariants: { orientation: 'horizontal' },
})
const item = useTemplateRef<{ $el: HTMLElement }>('item')
const position = computed(() => (item.value ? slides.value.indexOf(item.value.$el) : -1))
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    ref="item"
    data-slot="carousel-item"
    role="group"
    :aria-roledescription="props.roleDescription"
    :aria-label="position < 0 ? undefined : props.label(position + 1, slides.length)"
    :class="[carouselItem({ orientation }), 'basis-full', props.class]"
  >
    <slot />
  </Primitive>
</template>

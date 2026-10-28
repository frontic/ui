<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows one mark of the rating, either filled or empty. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import type { RatingShape, RatingSize } from '.'

const ratingDot = cva('fui-rating-dot', {
  variants: {
    fill: { full: 'fui-rating-dot-full', empty: 'fui-rating-dot-empty' },
    size: { sm: 'fui-rating-dot-sm', md: 'fui-rating-dot-md', lg: 'fui-rating-dot-lg' },
  },
  defaultVariants: { fill: 'full', size: 'md' },
})

const ratingIcon = cva('fui-rating-icon', {
  variants: {
    fill: { full: 'fui-rating-icon-full', empty: 'fui-rating-icon-empty' },
    size: { sm: 'fui-rating-icon-sm', md: 'fui-rating-icon-md', lg: 'fui-rating-icon-lg' },
  },
  defaultVariants: { fill: 'full', size: 'md' },
})

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The size of the mark. */
    size?: RatingSize
    /** Draws the mark as a dot or a star. */
    shape?: RatingShape
    /** Draws the mark unfilled, for the part of the rating it does not reach. */
    empty?: boolean
  }>(),
  { size: 'md', shape: 'star', empty: false },
)

const fill = computed(() => (props.empty ? 'empty' : 'full'))
</script>

<template>
  <slot>
    <span v-if="props.shape === 'dot'" v-bind="$attrs" data-slot="rating-dot" :class="[ratingDot({ fill, size: props.size }), props.class]" />
    <IconPlaceholder
      v-else
      lucide="StarIcon"
      tabler="IconStar"
      hugeicons="StarIcon"
      phosphor="StarIcon"
      remixicon="RiStarLine"
      v-bind="$attrs"
      data-slot="rating-icon"
      :class="[ratingIcon({ fill, size: props.size }), props.class]"
    />
  </slot>
</template>

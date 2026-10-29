<script setup lang="ts">
// One mark of a rating input, filled up to the picked or hovered mark.
import { cva } from 'class-variance-authority'
import { injectRatingRootContext, RatingItem, RatingItemIndicator } from 'reka-ui'
import { computed } from 'vue'
import { RatingIcon } from '@library/components/ui/rating'
import type { RatingShape, RatingSize } from '@library/components/ui/rating'

const props = defineProps<{
  /** The value this mark picks. */
  item: number
  size?: RatingSize
  shape?: RatingShape
}>()

const ratingInputItem = cva('fui-rating-input-item flex outline-none focus-visible:fui-focus-ring disabled:cursor-not-allowed disabled:fui-disabled', {
  variants: { shape: { dot: 'fui-rating-input-item-dot', star: 'fui-rating-input-item-star' } },
  defaultVariants: { shape: 'star' },
})

const root = injectRatingRootContext()
// Reka's own test for data-state="active", which it does not hand to the slot.
const filled = computed(() => {
  const hovered = root.hoveredRating.value
  return hovered > 0 ? props.item <= hovered : props.item <= (root.modelValue.value ?? 0)
})
</script>

<template>
  <RatingItem :item="props.item" as-child>
    <RatingItemIndicator :step="props.item" data-slot="rating-input-item" :class="ratingInputItem({ shape: props.shape })">
      <RatingIcon aria-hidden="true" :empty="!filled" :size="props.size" :shape="props.shape" />
    </RatingItemIndicator>
  </RatingItem>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows a rating as filled and empty marks, with an optional value and review count; the brand's rating colour fills the marks. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { type RatingSize, RatingIcon, RatingMeta } from '.'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The size of each mark. */
    size?: RatingSize
    /** Draws the rating as dots or stars. */
    shape?: 'dot' | 'star'
    /** The score to show; the mark it reaches into fills by its fraction. */
    rating: number
    /** The number of marks, and the top of the scale. */
    max?: number
    /** The number of reviews, shown in brackets after the score. */
    count?: number
    /** A filled #meta slot takes precedence over showValue. */
    showValue?: boolean
    /** Builds the screen-reader text from the score, the top of the scale and the review count, e.g. `4 out of 5`. The score is the rating to one decimal; the count comes only when showValue prints it. */
    label?: (score: number, max: number, count?: number) => string
  }>(),
  {
    size: 'md',
    shape: 'star',
    max: 5,
    showValue: false,
    label: (score: number, max: number, count?: number) => `${score} out of ${max}${count ? `, ${count} ${count === 1 ? 'review' : 'reviews'}` : ''}`,
  },
)

const score = computed(() => Math.round(Math.max(0, Math.min(props.rating, props.max)) * 10) / 10)
const filledStars = computed(() => Math.floor(score.value))
const fraction = computed(() => Math.round((score.value - filledStars.value) * 100))
const emptyStars = computed(() => props.max - filledStars.value - (fraction.value ? 1 : 0))
const meta = () => !slots.meta && props.showValue
const label = () => (meta() ? props.label(score.value, props.max, props.count) : props.label(score.value, props.max))

const ratingRoot = cva('fui-rating')
const stars = cva('fui-rating-stars flex items-center', {
  variants: { shape: { dot: 'fui-rating-stars-dot', star: 'fui-rating-stars-star' } },
})

const slots = defineSlots<{
  /** Replaces the score and review count after the marks; gets the rating, the top of the scale and the review count. */
  meta?: (props: { rating: number; max: number; count: number | undefined }) => unknown
}>()
</script>

<template>
  <div data-slot="rating" :class="[ratingRoot(), props.class]">
    <span data-slot="rating-stars" role="img" :aria-label="label()" :class="stars({ shape: props.shape })">
      <RatingIcon v-for="i in filledStars" :key="`filled-${i}`" aria-hidden="true" :size="props.size" :shape="props.shape" />
      <span v-if="fraction" data-slot="rating-partial" aria-hidden="true" class="relative inline-flex shrink-0">
        <RatingIcon empty :size="props.size" :shape="props.shape" />
        <span data-slot="rating-partial-fill" class="absolute inset-y-0 inset-s-0 flex overflow-hidden" :style="{ width: `${fraction}%` }">
          <RatingIcon :size="props.size" :shape="props.shape" />
        </span>
      </span>
      <RatingIcon v-for="i in emptyStars" :key="`empty-${i}`" aria-hidden="true" empty :size="props.size" :shape="props.shape" />
    </span>
    <span v-if="$slots.meta" data-slot="rating-meta" class="fui-rating-meta flex items-baseline">
      <span data-slot="rating-count" class="fui-rating-count"><slot name="meta" :rating="props.rating" :max="props.max" :count="props.count" /></span>
    </span>
    <RatingMeta v-else-if="meta()" aria-hidden="true" :rating="score" :max="props.max" :count="props.count" />
  </div>
</template>

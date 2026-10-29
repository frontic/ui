<script lang="ts">
/** Shows the numeric rating and the number of reviews behind it. */
export default {}
</script>

<script setup lang="ts">
import { formatRating } from '@library/lib/format'
import { useLocale } from 'reka-ui'
import { toRef } from 'vue'
const props = defineProps<{
  /** The score, shown as `rating/max`. */
  rating: number
  /** The top of the scale, shown after the score. */
  max: number
  /** The number of reviews, shown in brackets; hidden when 0 or left out. */
  count?: number
  /** BCP 47 locale the score is formatted in; the ConfigProvider's when left out. */
  locale?: string
}>()
const locale = useLocale(toRef(() => props.locale))
</script>

<template>
  <div data-slot="rating-meta" class="fui-rating-meta">
    <span data-slot="rating-value" class="fui-rating-value">{{ formatRating(props.rating, locale) }}/{{ props.max }}</span>
    <span v-if="props.count" data-slot="rating-count" class="fui-rating-count">({{ props.count }})</span>
  </div>
</template>

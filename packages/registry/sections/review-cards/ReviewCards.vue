<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the average rating with its breakdown, review cards and a write-a-review prompt. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { RatingCount, ReviewItem } from './types'
import { computed, toRef } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@library/components/ui/avatar'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Progress } from '@library/components/ui/progress'
import { Rating } from '@library/components/ui/rating'
import { Separator } from '@library/components/ui/separator'
import { formatDate, formatRating, percentOf } from '@library/lib/format'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { useLocale } from 'reka-ui'
import { initials } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The average rating out of 5, shown large with one decimal. */
    average?: number
    /** How many reviews there are in all; the rating shares are taken from it. */
    totalCount?: number
    /** How many reviews gave each star rating, shown as bars in the order given. */
    counts?: RatingCount[]
    /** The reviews listed beside the summary. */
    reviews?: ReviewItem[]
    /** Shown as the section's heading. */
    title?: string
    /** Shown beside the average, saying how many reviews it is based on. */
    summaryLabel?: (count: number) => string
    /** Screen-reader heading of the rating bars. */
    distributionLabel?: string
    /** Read after the star number of each rating bar, e.g. `5 star reviews`. */
    starReviewsLabel?: string
    /** Heading above the write-a-review button. */
    shareTitle?: string
    /** Shown under the share heading, inviting the shopper to write a review. */
    shareText?: string
    /** Shown on the button that starts a new review. */
    writeReviewLabel?: string
    /** Screen-reader heading of the review list. */
    reviewsLabel?: string
    /** Shown on the badge of a review from a verified purchase. */
    verifiedLabel?: string
    /** Shown in place of the reviews when there are none. */
    emptyLabel?: string
    /** BCP 47 locale the average and the review dates are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    average: 0,
    totalCount: 0,
    counts: () => [],
    reviews: () => [],
    title: 'Customer reviews',
    summaryLabel: (count: number) => `Based on ${count} ${count === 1 ? 'review' : 'reviews'}`,
    distributionLabel: 'Review data',
    starReviewsLabel: 'star reviews',
    shareTitle: 'Share your thoughts',
    shareText: "If you've used this product, share your thoughts with other customers",
    writeReviewLabel: 'Write a review',
    reviewsLabel: 'Recent reviews',
    verifiedLabel: 'Verified purchase',
    emptyLabel: 'No reviews yet.',
  },
)
const locale = useLocale(toRef(() => props.locale))
const emit = defineEmits<{
  /** Fires when the shopper clicks the write-a-review button. */
  'write-review': []
}>()

const averageText = computed(() => formatRating(props.average, locale.value))

const dateText = (date: string) => formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' }, locale.value)

const percentage = (count: number) => percentOf(count, props.totalCount)
</script>

<template>
  <div data-slot="review-cards" :class="['fui-review-cards @container', props.class]">
    <div class="mx-auto max-w-2xl px-4 py-12 @2xl:px-6 @2xl:py-16 @5xl:grid @5xl:max-w-7xl @5xl:grid-cols-12 @5xl:gap-x-8 @5xl:px-8">
      <div class="@5xl:col-span-4">
        <h2 data-slot="review-cards-heading" class="fui-review-cards-heading">
          {{ title }}
        </h2>

        <div class="mt-4 flex items-center gap-4">
          <span data-slot="review-cards-average" class="fui-review-cards-average tabular-nums">{{ averageText }}</span>
          <p data-slot="review-cards-summary" class="fui-review-cards-summary">
            {{ summaryLabel(totalCount) }}
          </p>
        </div>

        <div class="mt-6">
          <h3 class="sr-only">{{ distributionLabel }}</h3>
          <dl class="flex flex-col gap-2">
            <div v-for="count in counts" :key="count.rating" class="flex items-center gap-3">
              <dt class="flex flex-1 items-center gap-3">
                <span data-slot="review-cards-star" class="fui-review-cards-star shrink-0 tabular-nums">
                  {{ count.rating }}<span class="sr-only"> {{ starReviewsLabel }}</span>
                </span>
                <Progress :model-value="percentage(count.count)" :aria-label="`${count.rating} ${starReviewsLabel}`" />
              </dt>
              <dd data-slot="review-cards-percent" class="fui-review-cards-percent text-end tabular-nums">{{ percentage(count.count) }}%</dd>
            </div>
          </dl>
        </div>

        <div class="mt-10">
          <div class="flex flex-col gap-1">
            <h3 data-slot="part-title-lg" class="fui-part-title-lg">
              {{ shareTitle }}
            </h3>
            <p data-slot="hint" class="fui-hint">{{ shareText }}</p>
          </div>
          <Button variant="outline" color="neutral" class="mt-4 w-full @2xl:w-auto @5xl:w-full" @click="emit('write-review')">{{ writeReviewLabel }}</Button>
        </div>
      </div>

      <div class="mt-12 @5xl:col-span-7 @5xl:col-start-6 @5xl:mt-0">
        <h3 class="sr-only">{{ reviewsLabel }}</h3>
        <p v-if="!reviews.length" data-slot="hint" class="fui-hint">{{ emptyLabel }}</p>
        <div v-else class="-my-8">
          <template v-for="(review, index) in reviews" :key="review.id">
            <Separator v-if="index > 0" />
            <article class="py-8">
              <div class="flex items-center gap-4">
                <Avatar>
                  <AvatarImage v-if="review.avatar" :src="review.avatar" :alt="review.author" />
                  <AvatarFallback>{{ initials(review.author) }}</AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h4 data-slot="review-cards-author" class="fui-review-cards-author">
                      {{ review.author }}
                    </h4>
                    <time data-slot="meta" class="fui-meta" :datetime="review.date">{{ dateText(review.date) }}</time>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <Rating :rating="review.rating" :max="5" size="sm" />
                    <Badge v-if="review.verified" variant="success" size="sm">
                      <IconPlaceholder lucide="CircleCheckIcon" tabler="IconCircleCheck" hugeicons="CheckmarkCircle01Icon" phosphor="CheckCircleIcon" remixicon="RiCheckboxCircleLine" data-icon />
                      {{ verifiedLabel }}
                    </Badge>
                  </div>
                </div>
              </div>
              <p data-slot="review-cards-content" class="fui-review-cards-content">
                {{ review.content }}
              </p>
            </article>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

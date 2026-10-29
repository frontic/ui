<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ReviewsEntry, ReviewsShare } from './types'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Avatar, AvatarFallback, AvatarImage } from '@library/components/ui/avatar'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Progress } from '@library/components/ui/progress'
import { Rating } from '@library/components/ui/rating'
import { Separator } from '@library/components/ui/separator'
import { formatDate, formatRating, percentOf } from '@library/lib/format'
import { useLocale } from 'reka-ui'
import { toRef } from 'vue'
import { initials } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** Shown as the card's title. */
    title?: string
    /** What the reviews are for, such as the product name. */
    description?: string
    /** The average rating, 0 to 5. */
    rating: number
    /** How many reviews there are in all. */
    total: number
    /** How many reviews gave each star rating, five stars first. */
    distribution?: ReviewsShare[]
    /** The reviews listed under the summary. */
    reviews?: ReviewsEntry[]
    /** Shown under the average, saying how many reviews there are. */
    totalLabel?: (count: number) => string
    /** Screen-reader label of each rating bar, e.g. `4 stars`. */
    starsLabel?: (stars: number) => string
    /** Shown beside the rating of a review from a verified purchase. */
    verifiedLabel?: string
    /** Shown on the button that opens all reviews. */
    readAllLabel?: (count: number) => string
    /** Shown on the button that starts a new review. */
    writeLabel?: string
    /** The mark each review's rating is drawn with. */
    ratingShape?: 'dot' | 'star'
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    /** BCP 47 locale the score and dates are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Customer reviews',
    distribution: () => [],
    reviews: () => [],
    totalLabel: (count: number) => (count === 1 ? '1 review' : `${count} reviews`),
    starsLabel: (stars: number) => (stars === 1 ? '1 star' : `${stars} stars`),
    verifiedLabel: 'Verified purchase',
    readAllLabel: (count: number) => `Read all ${count}`,
    writeLabel: 'Write a review',
    ratingShape: 'star',
  },
)
const locale = useLocale(toRef(() => props.locale))
const emit = defineEmits<{
  /** Fires when the shopper clicks the button to read all reviews. */
  readAll: []
  /** Fires when the shopper clicks the button to write a review. */
  write: []
}>()

const share = (count: number) => percentOf(count, props.total)
const initialsOf = (review: ReviewsEntry) => initials(review.author, review.initials)
</script>

<template>
  <Card :surface="surface" :class="['@container', props.class]">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <div class="flex items-center gap-6">
        <div class="flex shrink-0 flex-col gap-1">
          <span data-slot="heading" class="fui-heading">{{ formatRating(rating, locale) }}</span>
          <span data-slot="meta" class="fui-meta">{{ totalLabel(total) }}</span>
        </div>
        <ul v-if="distribution.length" class="flex flex-1 flex-col gap-1.5">
          <li v-for="row in distribution" :key="row.stars" class="flex items-center gap-2">
            <span data-slot="reviews-stars" class="fui-reviews-stars flex shrink-0 items-center tabular-nums">
              {{ row.stars }}
            </span>
            <Progress :model-value="share(row.count)" :aria-label="starsLabel(row.stars)" class="flex-1" />
            <span data-slot="reviews-count" class="fui-reviews-count shrink-0 tabular-nums">{{ row.count }}</span>
          </li>
        </ul>
      </div>
      <template v-if="reviews.length">
        <Separator />
        <div class="flex flex-col gap-5">
          <article v-for="(review, index) in reviews" :key="index" class="flex gap-3">
            <Avatar size="sm">
              <AvatarImage v-if="review.avatar" :src="review.avatar" :alt="review.author" />
              <AvatarFallback>{{ initialsOf(review) }}</AvatarFallback>
            </Avatar>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <span data-slot="line-title" class="fui-line-title">{{ review.author }}</span>
                <time v-if="review.date" data-slot="meta" class="fui-meta" :datetime="review.date">{{ formatDate(review.date, { year: 'numeric', month: 'short', day: 'numeric' }, locale) }}</time>
              </div>
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Rating :rating="review.rating" size="sm" :shape="ratingShape" />
                <span v-if="review.verified" data-slot="reviews-verified" class="fui-reviews-verified flex items-center">
                  <IconPlaceholder lucide="BadgeCheckIcon" tabler="IconRosetteDiscountCheck" hugeicons="CheckmarkBadge01Icon" phosphor="SealCheckIcon" remixicon="RiVerifiedBadgeLine" data-icon />
                  {{ verifiedLabel }}
                </span>
              </div>
              <p data-slot="hint" class="fui-hint">{{ review.content }}</p>
            </div>
          </article>
        </div>
      </template>
    </CardContent>
    <CardFooter class="flex-col-reverse gap-2 @sm:flex-row">
      <Button variant="outline" color="neutral" class="w-full @sm:w-auto @sm:flex-1" @click="emit('readAll')">{{ readAllLabel(total) }}</Button>
      <Button class="w-full @sm:w-auto @sm:flex-1" @click="emit('write')">{{ writeLabel }}</Button>
    </CardFooter>
  </Card>
</template>

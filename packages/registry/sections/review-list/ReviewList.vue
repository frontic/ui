<script lang="ts">
/** Lists customer reviews with the reviewer, date, rating and verified-purchase mark. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ReviewItem } from './types'
import { Avatar, AvatarFallback, AvatarImage } from '@library/components/ui/avatar'
import { Badge } from '@library/components/ui/badge'
import { Rating } from '@library/components/ui/rating'
import { Separator } from '@library/components/ui/separator'
import { formatDate } from '@library/lib/format'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { useLocale } from 'reka-ui'
import { toRef } from 'vue'
import { initials } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** Screen-reader heading of the list. */
    title?: string
    /** The reviews to list, in the order given. */
    reviews?: ReviewItem[]
    /** Shown on the badge of a review from a verified purchase. */
    verifiedLabel?: string
    /** Shown in place of the list when there are no reviews. */
    emptyLabel?: string
    /** BCP 47 locale the review dates are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    title: 'Customer reviews',
    reviews: () => [],
    verifiedLabel: 'Verified purchase',
    emptyLabel: 'No reviews yet.',
  },
)
const locale = useLocale(toRef(() => props.locale))

const dateText = (date: string) => formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' }, locale.value)
</script>

<template>
  <div data-slot="review-list" :class="['fui-review-list @container', props.class]">
    <div class="mx-auto max-w-2xl px-4 py-12 @2xl:px-6 @2xl:py-16 @5xl:max-w-4xl @5xl:px-8">
      <h2 class="sr-only">{{ title }}</h2>

      <p v-if="!reviews.length" data-slot="hint" class="fui-hint">{{ emptyLabel }}</p>
      <div v-else class="-my-8">
        <article v-for="(review, index) in reviews" :key="review.id" class="flex gap-4">
          <div class="shrink-0 py-8">
            <Avatar>
              <AvatarImage v-if="review.avatar" :src="review.avatar" :alt="review.author" />
              <AvatarFallback>{{ initials(review.author) }}</AvatarFallback>
            </Avatar>
          </div>

          <div class="min-w-0 flex-1">
            <Separator v-if="index > 0" />
            <div class="flex flex-col gap-3 py-8">
              <div class="flex flex-col gap-1">
                <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 data-slot="section-title" class="fui-section-title">
                    {{ review.author }}
                  </h3>
                  <p data-slot="meta" class="fui-meta">
                    <time :datetime="review.date">{{ dateText(review.date) }}</time>
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <Rating :rating="review.rating" :max="5" size="sm" />
                  <Badge v-if="review.verified" variant="success" size="sm">
                    <IconPlaceholder lucide="CircleCheckIcon" tabler="IconCircleCheck" hugeicons="CheckmarkCircle01Icon" phosphor="CheckCircleIcon" remixicon="RiCheckboxCircleLine" data-icon />
                    {{ verifiedLabel }}
                  </Badge>
                </div>
              </div>

              <p data-slot="copy-muted" class="fui-copy-muted">
                {{ review.content }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

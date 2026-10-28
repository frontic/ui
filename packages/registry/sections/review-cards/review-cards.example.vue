<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ReviewCards, type RatingCount, type ReviewItem } from '.'

defineOptions({ inheritAttrs: false })

const avatar = (n: number) =>
  `https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/${n}.jpg`

// Reviews of the Frost Escape Parka.
const counts: RatingCount[] = [
  { rating: 5, count: 151 },
  { rating: 4, count: 38 },
  { rating: 3, count: 12 },
  { rating: 2, count: 7 },
  { rating: 1, count: 4 },
]

const reviews: ReviewItem[] = [
  {
    id: '1',
    author: 'Marta K.',
    avatar: avatar(8),
    date: '2026-10-04',
    rating: 5,
    verified: true,
    content:
      'A week of −15 °C and a biting wind on the slopes, and I stayed warm. The hood fits over a helmet.',
  },
  {
    id: '2',
    author: 'Jonas B.',
    avatar: avatar(3),
    date: '2026-09-28',
    rating: 4,
    verified: true,
    content:
      'Warm without the bulk. Runs a little long in the arms, so I went one size down.',
  },
  {
    id: '3',
    author: 'Lea S.',
    avatar: avatar(9),
    date: '2026-09-17',
    rating: 5,
    content:
      'My daily coat from November to March. Rain beads straight off it, and the inner pockets hold a phone and gloves.',
  },
]
</script>

<template>
  <ReviewCards
    :average="4.6"
    :total-count="212"
    :counts="counts"
    :reviews="reviews"
    v-bind="$attrs" />
</template>

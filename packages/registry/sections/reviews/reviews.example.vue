<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { Reviews, type ReviewsEntry, type ReviewsShare } from '.'

defineOptions({ inheritAttrs: false })

const avatar = (n: number) =>
  `https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/${n}.jpg`

const distribution: ReviewsShare[] = [
  { stars: 5, count: 151 },
  { stars: 4, count: 38 },
  { stars: 3, count: 12 },
  { stars: 2, count: 7 },
  { stars: 1, count: 4 },
]

const reviews: ReviewsEntry[] = [
  {
    author: 'Marta K.',
    avatar: avatar(8),
    date: '2026-10-04',
    rating: 5,
    content:
      'A week of −15 °C and a biting wind on the slopes, and I stayed warm. The hood fits over a helmet.',
    verified: true,
  },
  {
    author: 'Jonas B.',
    avatar: avatar(3),
    date: '2026-09-28',
    rating: 4,
    content:
      'Warm without the bulk. Runs a little long in the arms, so I went one size down.',
    verified: true,
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <Reviews
      description="Frost Escape Parka"
      :rating="4.6"
      :total="212"
      :distribution="distribution"
      :reviews="reviews"
      v-bind="$attrs" />
  </div>
</template>

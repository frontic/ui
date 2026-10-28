<script setup lang="ts">
import { ReviewList, type ReviewItem } from '.'

defineOptions({ inheritAttrs: false })

const avatar = (n: number) =>
  `https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/${n}.jpg`

// Reviews of the Blizzard Defender.
const reviews: ReviewItem[] = [
  {
    id: '1',
    author: 'Sofia R.',
    avatar: avatar(7),
    date: '2026-10-06',
    rating: 5,
    verified: true,
    content:
      'Took it up the Zugspitze in sleet and came down dry. The hood stays put in the wind, and the cuffs seal over my gloves.',
  },
  {
    id: '2',
    author: 'Daniel M.',
    avatar: avatar(2),
    date: '2026-09-30',
    rating: 5,
    verified: true,
    content:
      'The aubergine looks even better in person. Warm enough for ski days without a mid layer, and the zips run smoothly with gloves on.',
  },
  {
    id: '3',
    author: 'Petra H.',
    date: '2026-09-21',
    rating: 4,
    content:
      'Great jacket for the price. The fit is roomy, so I would size down if you wear it without a fleece underneath.',
  },
]
</script>

<template>
  <ReviewList :reviews="reviews" v-bind="$attrs" />
</template>

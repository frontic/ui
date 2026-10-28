<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { Rating } from '@library/components/ui/rating'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.'

defineOptions({ inheritAttrs: false })

// A men's jacket from the demo shop's catalog: name, price with its reference
// price, rating and image.
const parka = {
  name: 'Summit Series Winter Parka',
  price: { amount: 13200, currency: 'EUR', ref: 15900 },
  rating: 4.7,
  image:
    'https://static.frontic.com/cdn-cgi/image/width=320,format=auto/ui/products/summit-series-winter-parka.jpg',
}
</script>

<template>
  <HoverCard default-open v-bind="$attrs">
    <HoverCardTrigger as-child>
      <Button variant="link" color="neutral" as="a" href="#">{{
        parka.name
      }}</Button>
    </HoverCardTrigger>
    <HoverCardContent class="flex gap-4">
      <Image
        :src="parka.image"
        :alt="parka.name"
        class="aspect-3/4 w-20 shrink-0" />
      <div class="flex min-w-0 flex-col justify-center gap-2">
        <Rating :rating="parka.rating" size="sm" />
        <Price :price="parka.price" />
      </div>
    </HoverCardContent>
  </HoverCard>
</template>

<script setup lang="ts">
import { OrderSummary, type CartLine } from '.'

defineOptions({ inheritAttrs: false })

const items: CartLine[] = [
  {
    id: 'northern-light-hybrid-jacket',
    name: 'Northern Light Hybrid Jacket',
    variant: 'Lavender · S',
    price: { amount: 11500, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/northern-light-hybrid-jacket-lavender.jpg',
  },
  {
    id: 'trailmaster-22',
    name: 'TrailMaster 22',
    variant: 'Brown · 20L',
    price: { amount: 14100, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/trailmaster-22.jpg',
  },
  {
    id: 'mountain-view-ski-goggles',
    name: 'Mountain View Ski Goggles',
    variant: 'Ice blue · One size',
    price: { amount: 6695, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/mountain-view-ski-goggles.jpg',
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <OrderSummary
      :items="items"
      description="Order #FR-20291 · placed Sep 24, 2026"
      :count-label="(count: number) => `${count} items`"
      :show-tax="false"
      total-note="Incl. VAT"
      v-bind="$attrs" />
  </div>
</template>

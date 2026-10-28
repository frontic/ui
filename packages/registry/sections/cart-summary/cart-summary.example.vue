<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { CartSummary, type CartSummaryLine } from '.'

defineOptions({ inheritAttrs: false })

const lines: CartSummaryLine[] = [
  {
    id: 'frost-escape-parka',
    name: 'Frost Escape Parka',
    variant: 'Sun yellow · M',
    price: { amount: 14900, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/frost-escape-parka.jpg',
    link: { path: 'https://sw.demo-shop.com/frost-escape-parka-3abd4b58' },
  },
  {
    id: 'snowflake-ski-goggles',
    name: 'Snowflake Ski Goggles',
    variant: 'Mint · One size',
    price: { amount: 12700, currency: 'EUR', ref: 15900 },
    quantity: 2,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/snowflake-ski-goggles.jpg',
    link: { path: 'https://sw.demo-shop.com/snowflake-ski-goggles-57f8abf9' },
  },
  {
    id: 'trailmaster-22',
    name: 'TrailMaster 22',
    variant: 'Brown · 20L',
    price: { amount: 14100, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/trailmaster-22.jpg',
    link: { path: 'https://sw.demo-shop.com/trailmaster-22-4d39c9d9' },
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <CartSummary
      :lines="lines"
      :shipping-cents="0"
      description="Free shipping and returns on all orders."
      v-bind="$attrs" />
  </div>
</template>

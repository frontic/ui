<script setup lang="ts">
import { ref } from 'vue'
import { CartItemCompact, type CartLine } from '.'

defineOptions({ inheritAttrs: false })

const items = ref<CartLine[]>([
  {
    id: 'frost-escape-parka',
    name: 'Frost Escape Parka',
    variant: 'Sun yellow · M',
    price: { amount: 14900, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/frost-escape-parka.jpg',
  },
  {
    id: 'snowflake-ski-goggles',
    name: 'Snowflake Ski Goggles',
    variant: 'Mint · One size',
    price: { amount: 12700, currency: 'EUR', ref: 15900 },
    quantity: 2,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/snowflake-ski-goggles.jpg',
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
])
</script>

<template>
  <div class="mx-auto w-full max-w-sm">
    <CartItemCompact v-model:items="items" v-bind="$attrs" />
  </div>
</template>

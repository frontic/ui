<script setup lang="ts">
import { ref } from 'vue'
import { CartMinimal, type CartLine } from '.'

defineOptions({ inheritAttrs: false })

const open = ref(true)

const items: CartLine[] = [
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
  {
    id: 'northern-light-hybrid-jacket',
    name: 'Northern Light Hybrid Jacket',
    variant: 'Lavender · S',
    price: { amount: 11500, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/northern-light-hybrid-jacket-lavender.jpg',
  },
]
</script>

<template>
  <div class="flex min-h-150 justify-end">
    <CartMinimal v-model:open="open" :items="items" v-bind="$attrs" />
  </div>
</template>

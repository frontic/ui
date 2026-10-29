<script setup lang="ts">
import { ProductCardMinimal, type Product } from '.'

defineOptions({ inheritAttrs: false })

const product: Product = {
  name: 'TrailMaster 22',
  key: 'trailmaster-22',
  description: 'Equipment · Backpacks · 20L',
  link: { path: 'https://sw.demo-shop.com/trailmaster-22-4d39c9d9' },
  price: { amount: 14100, currency: 'EUR' },
  cover: {
    src: 'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/trailmaster-22.jpg',
  },
  rating: 4.8,
  reviewCount: 64,
  badge: 'Bestseller',
}
</script>

<template>
  <div class="mx-auto w-full max-w-xs">
    <ProductCardMinimal :product="product" v-bind="$attrs" />
  </div>
</template>

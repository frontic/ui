<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ProductCardHorizontal, type Product } from '.'

defineOptions({ inheritAttrs: false })

const product: Product = {
  name: 'Alpine View Horizon',
  key: 'alpine-view-horizon',
  description:
    'A wide mirrored lens for a clear view across the piste, and a strap that sits securely over a helmet.',
  link: { path: 'https://sw.demo-shop.com/alpineview-horizon-4fda60a5' },
  price: { amount: 8400, currency: 'EUR', ref: 9900 },
  cover: {
    src: 'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/alpine-view-horizon.jpg',
  },
  rating: 4.3,
  reviewCount: 42,
  inStore: true,
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl">
    <ProductCardHorizontal :product="product" v-bind="$attrs" />
  </div>
</template>

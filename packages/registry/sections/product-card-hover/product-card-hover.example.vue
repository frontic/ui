<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ProductCardHover, type Product } from '.'

defineOptions({ inheritAttrs: false })

const product: Product = {
  name: 'Snowflake Ski Goggles',
  key: 'snowflake-ski-goggles',
  link: { path: 'https://sw.demo-shop.com/snowflake-ski-goggles-57f8abf9' },
  price: { amount: 12700, currency: 'EUR', ref: 15900 },
  cover: {
    src: 'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/snowflake-ski-goggles.jpg',
  },
  rating: 4.4,
  reviewCount: 64,
}
</script>

<template>
  <div class="mx-auto w-full max-w-xs">
    <ProductCardHover :product="product" v-bind="$attrs" />
  </div>
</template>

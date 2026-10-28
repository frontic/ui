<script setup lang="ts">
import { ProductCardFeatured, type Product } from '.'

defineOptions({ inheritAttrs: false })

const product: Product = {
  name: 'Frost Escape Parka',
  key: 'frost-escape-parka',
  brand: 'Northridge',
  description:
    'Made for the city: keeps you warm, dry and stylish however hard winter hits.',
  link: { path: 'https://sw.demo-shop.com/frost-escape-parka-3abd4b58' },
  price: { amount: 14900, currency: 'EUR' },
  cover: {
    src: 'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/frost-escape-parka.jpg',
  },
  badge: 'Insulated',
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm">
    <ProductCardFeatured :product="product" v-bind="$attrs" />
  </div>
</template>

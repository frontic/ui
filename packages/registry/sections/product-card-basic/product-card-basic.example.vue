<script setup lang="ts">
import { ProductCardBasic, type Product } from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const product: Product = {
  name: 'Northern Light Hybrid Jacket',
  key: 'northern-light-hybrid-jacket-black',
  price: { amount: 11500, currency: 'EUR' },
  cover: { src: image('northern-light-hybrid-jacket-charcoal') },
  rating: 4.7,
  reviewCount: 86,
  badge: 'New',
  inStore: true,
  siblings: {
    items: [
      {
        key: 'northern-light-hybrid-jacket-black',
        name: 'Charcoal',
        cover: { src: image('northern-light-hybrid-jacket-charcoal') },
        colors: { exactColorHex: '#4a4a47', exactColorName: 'Charcoal' },
      },
      {
        key: 'northern-light-hybrid-jacket-orchid',
        name: 'Lavender',
        cover: { src: image('northern-light-hybrid-jacket-lavender') },
        colors: { exactColorHex: '#b8a2cf', exactColorName: 'Lavender' },
      },
    ],
  },
}
</script>

<template>
  <div class="mx-auto w-full max-w-xs">
    <ProductCardBasic
      :product="product"
      eyebrow="Women · Jackets"
      v-bind="$attrs" />
  </div>
</template>

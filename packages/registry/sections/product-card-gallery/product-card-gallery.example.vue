<script setup lang="ts">
import { ProductCardGallery, type Product } from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const product: Product = {
  name: 'Blizzard Defender',
  key: 'blizzard-defender-455fb5a3',
  description: 'Built for snow-day adventures: warm, and free to move in.',
  link: { path: 'https://sw.demo-shop.com/blizzard-defender-455fb5a3' },
  price: { amount: 12600, currency: 'EUR' },
  cover: { src: image('blizzard-defender-aubergine') },
  rating: 4.6,
  reviewCount: 212,
  badge: 'New',
  siblings: {
    items: [
      {
        key: 'blizzard-defender-455fb5a3',
        name: 'Aubergine',
        cover: { src: image('blizzard-defender-aubergine') },
        link: { path: 'https://sw.demo-shop.com/blizzard-defender-455fb5a3' },
        colors: { exactColorHex: '#3d3347', exactColorName: 'Aubergine' },
      },
      {
        key: 'blizzard-defender-41d5aa85',
        name: 'Dusty rose',
        cover: { src: image('blizzard-defender-dusty-rose') },
        link: { path: 'https://sw.demo-shop.com/blizzard-defender-41d5aa85' },
        colors: { exactColorHex: '#b98a87', exactColorName: 'Dusty rose' },
      },
      {
        key: 'blizzard-defender-393a11b2',
        name: 'Salmon',
        cover: { src: image('blizzard-defender-salmon') },
        link: { path: 'https://sw.demo-shop.com/blizzard-defender-393a11b2' },
        colors: { exactColorHex: '#dc967b', exactColorName: 'Salmon' },
      },
    ],
  },
}
</script>

<template>
  <div class="mx-auto w-full max-w-xs">
    <ProductCardGallery
      :product="product"
      eyebrow="Men · Jackets"
      v-bind="$attrs" />
  </div>
</template>

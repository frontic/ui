<script setup lang="ts">
import { ref } from 'vue'
import { ProductOptions, type ProductColour, type ProductSize } from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const colours: ProductColour[] = [
  {
    value: 'aubergine',
    label: 'Aubergine',
    hex: '#3d3347',
    image: image('blizzard-defender-aubergine'),
    alt: 'Blizzard Defender in Aubergine',
  },
  {
    value: 'dusty-rose',
    label: 'Dusty rose',
    hex: '#b98a87',
    image: image('blizzard-defender-dusty-rose'),
    alt: 'Blizzard Defender in Dusty rose',
  },
  {
    value: 'salmon',
    label: 'Salmon',
    hex: '#dc967b',
    image: image('blizzard-defender-salmon'),
    alt: 'Blizzard Defender in Salmon',
    unavailable: true,
  },
]

const sizes: ProductSize[] = [
  { value: 'S' },
  { value: 'M' },
  { value: 'L' },
  { value: 'XL' },
  { value: 'XXL', disabled: true },
]

const colour = ref('aubergine')
const size = ref('M')
const quantity = ref(1)
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <ProductOptions
      v-model:colour="colour"
      v-model:size="size"
      v-model:quantity="quantity"
      title="Blizzard Defender"
      description="Men · Jackets"
      :price="{ amount: 12600, currency: 'EUR' }"
      :rating="4.6"
      :rating-count="212"
      :colours="colours"
      :sizes="sizes"
      :max-quantity="5"
      v-bind="$attrs" />
  </div>
</template>

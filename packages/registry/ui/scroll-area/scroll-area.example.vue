<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { ScrollArea } from '.'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const orientation = computed(
  () => (attrs.orientation as string | undefined) ?? 'vertical',
)
const tiles = computed(() => orientation.value !== 'vertical')

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/${name}.jpg`
const eur = (amount: number) => ({ amount, currency: 'EUR' })
const products = [
  {
    name: 'Frost Escape Parka',
    price: eur(14900),
    image: image('frost-escape-parka'),
  },
  {
    name: 'Winterwonder Parka',
    price: eur(18900),
    image: image('winterwonder-parka'),
  },
  {
    name: 'Blizzard Defender',
    price: eur(12600),
    image: image('blizzard-defender-aubergine'),
  },
  {
    name: 'Polar Light Ski Jacket',
    price: eur(7900),
    image: image('polar-light-ski-jacket'),
  },
  {
    name: 'Snowflake Ski Goggles',
    price: eur(12700),
    image: image('snowflake-ski-goggles'),
  },
  {
    name: 'Mountain View Ski Goggles',
    price: eur(9900),
    image: image('mountain-view-ski-goggles'),
  },
  { name: 'TrailMaster 22', price: eur(14100), image: image('trailmaster-22') },
]
</script>

<template>
  <ScrollArea
    :class="[
      'border border-border',
      { vertical: 'h-72 w-64', horizontal: 'w-80', both: 'h-72 w-80' }[
        orientation
      ],
    ]"
    v-bind="$attrs">
    <ul
      :class="
        {
          vertical: 'flex flex-col gap-3 p-4',
          horizontal: 'flex w-max gap-4 p-4',
          both: 'grid w-max grid-cols-4 gap-4 p-4',
        }[orientation]
      ">
      <li
        v-for="product in products"
        :key="product.name"
        :class="tiles ? 'flex w-28 flex-col gap-2' : 'flex items-center gap-3'">
        <Image
          :src="product.image"
          :alt="product.name"
          :class="tiles ? 'aspect-square w-28' : 'size-12 shrink-0'" />
        <div class="flex flex-col text-sm">
          <span>{{ product.name }}</span>
          <Price :price="product.price" />
        </div>
      </li>
    </ul>
  </ScrollArea>
</template>

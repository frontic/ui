<script setup lang="ts">
import { reactive } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { CardDescription, CardTitle } from '@library/components/ui/card'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  SwatchGroup,
  SwatchGroupItem,
} from '@library/components/ui/swatch-group'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselProgress,
} from '.'

defineOptions({ inheritAttrs: false })

const SHOP = 'https://sw.demo-shop.com'
const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

// The demo shop's men's jackets: catalog names, prices, colours, images and
// links. Each colour of a product is a variant.
const jackets = [
  {
    name: 'Blizzard Defender',
    price: { amount: 12600, currency: 'EUR' },
    badge: { label: 'Bestseller', variant: 'promo' },
    variants: [
      {
        slug: 'blizzard-defender-455fb5a3',
        colour: 'Aubergine',
        hex: '#3d3347',
        image: 'blizzard-defender-aubergine',
      },
      {
        slug: 'blizzard-defender-41d5aa85',
        colour: 'Dusty rose',
        hex: '#b98a87',
        image: 'blizzard-defender-dusty-rose',
      },
      {
        slug: 'blizzard-defender-393a11b2',
        colour: 'Salmon',
        hex: '#dc967b',
        image: 'blizzard-defender-salmon',
      },
    ],
  },
  {
    name: 'Summit Series Winter Parka',
    price: { amount: 13200, currency: 'EUR', ref: 15900 },
    variants: [
      {
        slug: 'summit-series-winter-parka-57dec9f4',
        colour: 'Charcoal',
        hex: '#4a4a47',
        image: 'summit-series-winter-parka',
      },
    ],
  },
  {
    name: 'Polar Light Ski Jacket',
    price: { amount: 7900, currency: 'EUR' },
    badge: { label: 'New', variant: 'new' },
    variants: [
      {
        slug: 'polarlicht-ski-jacket-476160a6',
        colour: 'Dusty pink',
        hex: '#d6aaa6',
        image: 'polar-light-ski-jacket',
      },
    ],
  },
  {
    name: 'Glacier Explorer',
    price: { amount: 9400, currency: 'EUR' },
    variants: [
      {
        slug: 'glacier-explorer-53fb49de',
        colour: 'Slate blue',
        hex: '#5f7680',
        image: 'glacier-explorer',
      },
    ],
  },
  {
    name: 'Arctic Fox Winter Jacket',
    price: { amount: 6100, currency: 'EUR', ref: 7900 },
    variants: [
      {
        slug: 'polarfuchs-winter-jacket-47b6cbf5',
        colour: 'Light grey',
        hex: '#d0d0ce',
        image: 'arctic-fox-winter-jacket',
      },
    ],
  },
  {
    name: 'Frost Escape Parka',
    price: { amount: 14900, currency: 'EUR' },
    variants: [
      {
        slug: 'frost-escape-parka-3abd4b58',
        colour: 'Sun yellow',
        hex: '#e5ad40',
        image: 'frost-escape-parka',
      },
    ],
  },
] as const

const picked = reactive<Record<string, string>>(
  Object.fromEntries(
    jackets.map((jacket) => [jacket.name, jacket.variants[0].slug]),
  ),
)
const shown = (jacket: (typeof jackets)[number]) =>
  jacket.variants.find((variant) => variant.slug === picked[jacket.name]) ??
  jacket.variants[0]
</script>

<template>
  <div class="@container w-4xl max-w-full">
    <div class="mx-auto w-full max-w-sm px-12 @xl:max-w-2xl @4xl:max-w-4xl">
      <Carousel :opts="{ align: 'start' }" class="w-full" v-bind="$attrs">
        <CarouselContent>
          <CarouselItem
            v-for="jacket in jackets"
            :key="jacket.name"
            class="@xl:basis-1/2 @4xl:basis-1/3">
            <article class="flex flex-col gap-3">
              <a
                :href="`${SHOP}/${shown(jacket).slug}`"
                class="group/link relative block overflow-hidden">
                <Image
                  :src="image(shown(jacket).image)"
                  :alt="`${jacket.name} in ${shown(jacket).colour}`"
                  class="aspect-square w-full transition-transform duration-500 ease-out group-hover/link:scale-105" />
                <Badge
                  v-if="'badge' in jacket"
                  :variant="jacket.badge.variant"
                  class="absolute top-3 inset-s-3"
                  >{{ jacket.badge.label }}</Badge
                >
              </a>
              <div class="flex flex-col gap-1">
                <CardTitle>{{ jacket.name }}</CardTitle>
                <Price :price="jacket.price" show-ref />
              </div>
              <SwatchGroup
                v-if="jacket.variants.length > 1"
                v-model="picked[jacket.name]"
                type="single"
                size="xs"
                shape="pill"
                label-class="sr-only">
                <SwatchGroupItem
                  v-for="variant in jacket.variants"
                  :key="variant.slug"
                  :value="variant.slug"
                  :hex="variant.hex"
                  :label="variant.colour" />
              </SwatchGroup>
              <CardDescription v-else>{{
                shown(jacket).colour
              }}</CardDescription>
            </article>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots
          class="relative bottom-auto left-auto mt-2 translate-x-0 justify-center" />
        <CarouselProgress class="mt-4" />
      </Carousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Image } from '@library/components/ui/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=480,format=auto/ui/products/${name}.jpg`

// Three slides at a time: each item takes a third of the viewport.
const jackets = [
  { name: 'Blizzard Defender', image: 'blizzard-defender-aubergine' },
  { name: 'Glacier Explorer', image: 'glacier-explorer' },
  { name: 'Arctic Fox Winter Jacket', image: 'arctic-fox-winter-jacket' },
  { name: 'Frost Escape Parka', image: 'frost-escape-parka' },
]
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-12">
    <Carousel :opts="{ align: 'start' }" class="w-full" v-bind="$attrs">
      <CarouselContent>
        <CarouselItem
          v-for="jacket in jackets"
          :key="jacket.name"
          class="basis-1/3">
          <figure class="flex flex-col gap-2">
            <Image
              :src="image(jacket.image)"
              :alt="jacket.name"
              class="aspect-square w-full" />
            <figcaption>{{ jacket.name }}</figcaption>
          </figure>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
</template>

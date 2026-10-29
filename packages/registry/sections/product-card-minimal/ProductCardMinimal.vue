<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Product } from './types'
import { computed } from 'vue'
import { useProductSibling } from '@library/composables/use-product-sibling'
import { Badge } from '@library/components/ui/badge'
import { Card, CardContent, CardImage } from '@library/components/ui/card'
import { AspectRatio } from '@library/components/ui/aspect-ratio'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { Rating } from '@library/components/ui/rating'
import { SwatchGroup, SwatchGroupItem } from '@library/components/ui/swatch-group'

const props = withDefaults(
  defineProps<{
    /** The product the card shows; its `badge`, `clearout` and `inStore` fields add badges over the image. */
    product: Product
    /** Text beside the rating that says how many colours the product comes in. */
    colorCountLabel?: (count: number) => string
    /** Shown on the badge of a product marked `clearout`. */
    clearoutLabel?: string
    /** Shown on the badge of a product that is available in store. */
    inStoreLabel?: string
    /** Names the colour swatches for screen readers. */
    colourLabel?: string
    /** BCP 47 locale the price is formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Builds the rating's screen-reader name from the score, to one decimal, and the top of the scale; `4.6 out of 5` when left out. */
    ratingLabel?: (score: number, max: number) => string
    /** The photo's width over its height: 1 (square) when left out, `3 / 4` for portrait shots. */
    ratio?: number
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    ratio: 1,
    colorCountLabel: (count: number) => `${count} ${count === 1 ? 'Color' : 'Colors'}`,
    clearoutLabel: 'Clearout',
    inStoreLabel: 'In Store',
    colourLabel: 'Colour',
  },
)

const { selected: selectedSibling, cover } = useProductSibling(() => props.product)
const href = computed(() => props.product.link?.path ?? '#')
const siblingCount = computed(() => props.product.siblings?.items?.length ?? 0)
</script>

<template>
  <Card :surface="surface" :class="['group relative transition-shadow', surface === 'raised' && 'fui-product-card-lift', props.class]">
    <CardImage class="relative">
      <a :href="href" tabindex="-1" aria-hidden="true" class="relative block">
        <div data-slot="product-card-minimal-image" class="fui-product-card-minimal-image overflow-hidden">
          <AspectRatio :ratio="ratio">
            <Image :src="cover" :alt="product.name" class="size-full transition-transform duration-500 ease-out group-hover:scale-105" />
          </AspectRatio>
        </div>
      </a>
      <div v-if="product.badge || product.clearout || product.inStore" class="absolute top-3 inset-s-3 flex flex-col items-start gap-1">
        <Badge v-if="product.badge" variant="promo">{{ product.badge }}</Badge>
        <Badge v-if="product.clearout" variant="discount">{{ clearoutLabel }}</Badge>
        <Badge v-if="product.inStore" variant="success">{{ inStoreLabel }}</Badge>
      </div>
    </CardImage>
    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-0.5">
        <h3 data-slot="product-card-title" :class="['fui-product-card-title', surface === 'bare' && 'group-hover:underline']">
          <a :href="href" :class="['outline-none focus-visible:fui-focus-ring', !siblingCount && 'after:absolute after:inset-0']">{{ product.name }}</a>
        </h3>
        <p v-if="product.description" data-slot="hint" class="fui-hint">
          {{ product.description }}
        </p>
      </div>

      <SwatchGroup v-if="product.siblings?.items?.length" v-model="selectedSibling" type="single" size="xs" shape="pill" label-class="sr-only" :aria-label="colourLabel">
        <SwatchGroupItem
          v-for="sibling in product.siblings.items.slice(0, 5)"
          :key="sibling.key"
          :value="sibling.key"
          :hex="sibling.colors?.exactColorHex"
          :label="sibling.colors?.exactColorName ?? sibling.name"
        />
      </SwatchGroup>

      <div v-if="product.rating || siblingCount" class="flex items-center justify-between gap-2">
        <Rating v-if="product.rating" :rating="product.rating" :label="ratingLabel" size="sm" />
        <p v-if="siblingCount" data-slot="meta" class="fui-meta">
          {{ colorCountLabel(siblingCount) }}
        </p>
      </div>

      <Price :price="product.price" :locale="locale" :show-discount="false" />
    </CardContent>
  </Card>
</template>

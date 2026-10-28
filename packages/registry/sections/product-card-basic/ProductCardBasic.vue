<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows a product with its image, price and rating, with an add-to-cart button. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Product } from './types'
import { computed, ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import { useProductSibling } from '@library/composables/use-product-sibling'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardImage } from '@library/components/ui/card'
import { AspectRatio } from '@library/components/ui/aspect-ratio'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { Rating } from '@library/components/ui/rating'
import { SwatchGroup, SwatchGroupItem } from '@library/components/ui/swatch-group'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** The product to show: name, price, cover, rating, badges and colour siblings. */
    product: Product
    /** Shown above the product's name, e.g. the brand or category. */
    eyebrow?: string
    /** Shown on the button that adds the product to the cart. */
    addToCartLabel?: string
    /** Shown on the add-to-cart button for two seconds after a click. */
    addedLabel?: string
    /** Shown on the badge of a product marked as clearout. */
    clearoutLabel?: string
    /** Shown on the badge of a product available in store. */
    inStoreLabel?: string
    /** Names the colour swatches for screen readers. */
    colourLabel?: string
    /** Shown after the swatches when the product has more colours than fit, e.g. `+2`. */
    moreColoursLabel?: (count: number) => string
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
    addToCartLabel: 'Add to Cart',
    addedLabel: 'Added',
    clearoutLabel: 'Clearout',
    inStoreLabel: 'In Store',
    colourLabel: 'Colour',
    moreColoursLabel: (count: number) => `+${count}`,
  },
)
const emit = defineEmits<{
  /** Fires with the product when the shopper adds it to the cart. */
  'add-to-cart': [product: Product]
}>()

const { selected: selectedSibling, cover } = useProductSibling(() => props.product)
const href = computed(() => props.product.link?.path ?? '#')
const SWATCHES = 5
const swatches = computed(() => props.product.siblings?.items?.slice(0, SWATCHES) ?? [])
const moreColours = computed(() => (props.product.siblings?.items?.length ?? 0) - swatches.value.length)
const hasBadges = computed(() => Boolean(props.product.badge || props.product.clearout || props.product.inStore))

const added = ref(false)
const { start: revertLater } = useTimeoutFn(() => (added.value = false), 2000, { immediate: false })

function addToCart() {
  emit('add-to-cart', props.product)
  added.value = true
  revertLater()
}
</script>

<template>
  <Card :surface="surface" :class="['fui-product-card-basic group transition-shadow', surface === 'raised' && 'fui-product-card-lift', props.class]">
    <CardImage class="relative">
      <a :href="href" tabindex="-1" aria-hidden="true" class="block">
        <div data-slot="product-card-basic-image" class="fui-product-card-basic-image overflow-hidden">
          <AspectRatio :ratio="ratio">
            <Image :src="cover" :alt="product.name" class="size-full transition-transform duration-500 ease-out group-hover:scale-105" />
          </AspectRatio>
        </div>
      </a>
      <div v-if="hasBadges" class="absolute top-3 inset-s-3 flex flex-col items-start gap-1">
        <Badge v-if="product.badge" variant="promo">{{ product.badge }}</Badge>
        <Badge v-if="product.clearout" variant="discount">{{ clearoutLabel }}</Badge>
        <Badge v-if="product.inStore" variant="success">{{ inStoreLabel }}</Badge>
      </div>
    </CardImage>

    <CardContent class="flex flex-1 flex-col gap-3">
      <div class="flex flex-col gap-1">
        <p v-if="eyebrow" data-slot="meta" class="fui-meta">{{ eyebrow }}</p>
        <h3 data-slot="product-card-title" :class="['fui-product-card-title line-clamp-2', surface === 'bare' && 'group-hover:underline']">
          <a :href="href" class="outline-none focus-visible:fui-focus-ring">{{ product.name }}</a>
        </h3>
        <Rating v-if="product.rating" :rating="product.rating" :label="ratingLabel" size="sm">
          <template v-if="product.reviewCount !== undefined" #meta>({{ product.reviewCount }})</template>
        </Rating>
      </div>

      <Price :price="product.price" :locale="locale" />

      <div v-if="swatches.length" class="flex items-center gap-2">
        <SwatchGroup v-model="selectedSibling" type="single" size="xs" shape="pill" label-class="sr-only" :aria-label="colourLabel">
          <SwatchGroupItem v-for="sibling in swatches" :key="sibling.key" :value="sibling.key" :hex="sibling.colors?.exactColorHex" :label="sibling.colors?.exactColorName ?? sibling.name" />
        </SwatchGroup>
        <p v-if="moreColours > 0" data-slot="meta" class="fui-meta">{{ moreColoursLabel(moreColours) }}</p>
      </div>

      <Button color="buy" class="mt-auto w-full" aria-live="polite" @click="addToCart">
        <IconPlaceholder v-if="added" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
        <IconPlaceholder v-else lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" data-icon />
        {{ added ? addedLabel : addToCartLabel }}
      </Button>
    </CardContent>
  </Card>
</template>

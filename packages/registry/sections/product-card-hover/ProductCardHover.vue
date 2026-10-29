<script lang="ts">
/** Shows a product with its image and price, with a quick-add button. */
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
import { Price, PriceAmount, PriceRef } from '@library/components/ui/price'
import { Rating } from '@library/components/ui/rating'
import { SwatchGroup, SwatchGroupItem } from '@library/components/ui/swatch-group'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** The product the card shows; its `badge`, `clearout` and `inStore` fields add badges over the image. */
    product: Product
    /** Shown on the add-to-cart button that appears over the image on hover or focus. */
    quickAddLabel?: string
    /** Shown on the quick-add button for two seconds after the product was added. */
    addedLabel?: string
    /** Shown on the badge of a product marked `clearout`. */
    clearoutLabel?: string
    /** Shown on the badge of a product that is available in store. */
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
    quickAddLabel: 'Quick add',
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
const SWATCHES = 4
const swatches = computed(() => props.product.siblings?.items?.slice(0, SWATCHES) ?? [])
const moreColours = computed(() => (props.product.siblings?.items?.length ?? 0) - swatches.value.length)

const added = ref(false)
const { start: revertLater } = useTimeoutFn(() => (added.value = false), 2000, { immediate: false })

function addToCart() {
  emit('add-to-cart', props.product)
  added.value = true
  revertLater()
}
</script>

<template>
  <Card :surface="surface" :class="['group transition-shadow', surface === 'raised' && 'fui-product-card-lift', props.class]">
    <CardImage class="relative">
      <a :href="href" tabindex="-1" aria-hidden="true" class="relative block">
        <div data-slot="product-card-hover-image" class="fui-product-card-hover-image overflow-hidden">
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
      <div
        class="absolute inset-x-3 bottom-3 z-20 translate-y-2 opacity-0 transition duration-300 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100"
      >
        <Button color="buy" size="sm" class="w-full" aria-live="polite" @click="addToCart">
          <IconPlaceholder v-if="added" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
          <IconPlaceholder v-else lucide="PlusIcon" tabler="IconPlus" hugeicons="PlusSignIcon" phosphor="PlusIcon" remixicon="RiAddLine" data-icon />
          {{ added ? addedLabel : quickAddLabel }}
        </Button>
      </div>
    </CardImage>
    <CardContent class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h3 data-slot="product-card-title" :class="['fui-product-card-title', surface === 'bare' && 'group-hover:underline']">
          <a :href="href" class="outline-none focus-visible:fui-focus-ring">{{ product.name }}</a>
        </h3>
        <Price :price="product.price" :locale="locale" :show-discount="false" align="end" class="shrink-0">
          <PriceAmount />
          <PriceRef />
        </Price>
      </div>
      <Rating v-if="product.rating" :rating="product.rating" :label="ratingLabel" size="sm">
        <template v-if="product.reviewCount !== undefined" #meta>({{ product.reviewCount }})</template>
      </Rating>
      <div v-if="swatches.length" class="flex items-center gap-2">
        <SwatchGroup v-model="selectedSibling" type="single" size="xs" shape="pill" label-class="sr-only" :aria-label="colourLabel">
          <SwatchGroupItem v-for="sibling in swatches" :key="sibling.key" :value="sibling.key" :hex="sibling.colors?.exactColorHex" :label="sibling.colors?.exactColorName ?? sibling.name" />
        </SwatchGroup>
        <p v-if="moreColours > 0" data-slot="meta" class="fui-meta">{{ moreColoursLabel(moreColours) }}</p>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts">
/** Shows a product with its image, colour options, price and rating, and a wishlist button. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Product } from './types'
import { computed, ref } from 'vue'
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
    /** The product the card shows; its `badge`, `clearout` and `inStore` fields add badges over the image. */
    product: Product
    /** Small text above the product name, such as the brand or collection. */
    eyebrow?: string
    /** Screen-reader label of the heart button while the product is not on the wishlist. */
    wishlistLabel?: string
    /** Screen-reader label of the heart button once the product is on the wishlist. */
    wishlistedLabel?: string
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
    wishlistLabel: 'Add to wishlist',
    wishlistedLabel: 'Remove from wishlist',
    clearoutLabel: 'Clearout',
    inStoreLabel: 'In Store',
    colourLabel: 'Colour',
    moreColoursLabel: (count: number) => `+${count}`,
  },
)
const emit = defineEmits<{
  /** Fires with the product when the shopper toggles it on the wishlist. */
  wishlist: [product: Product]
}>()

const { selected: selectedSibling, cover } = useProductSibling(() => props.product)
const href = computed(() => props.product.link?.path ?? '#')
const SWATCHES = 6
const swatches = computed(() => props.product.siblings?.items?.slice(0, SWATCHES) ?? [])
const moreColours = computed(() => (props.product.siblings?.items?.length ?? 0) - swatches.value.length)

const wishlisted = ref(false)

function wishlist() {
  wishlisted.value = !wishlisted.value
  emit('wishlist', props.product)
}
</script>

<template>
  <Card :surface="surface" :class="['group transition-shadow', surface === 'raised' && 'fui-product-card-lift', props.class]">
    <CardImage class="relative">
      <a :href="href" tabindex="-1" aria-hidden="true" class="block">
        <div data-slot="product-card-gallery-image" class="fui-product-card-gallery-image overflow-hidden">
          <AspectRatio :ratio="ratio">
            <Image :src="cover" :alt="product.name" class="size-full transition-transform duration-500 ease-out group-hover:scale-105" />
          </AspectRatio>
        </div>
      </a>
      <div v-if="product.badge || product.clearout || product.inStore" class="absolute top-3 inset-s-3 flex flex-col items-start gap-1">
        <Badge v-if="product.badge" variant="new" data-slot="product-card-gallery-badge" class="fui-product-card-gallery-badge">{{ product.badge }}</Badge>
        <Badge v-if="product.clearout" variant="discount">{{ clearoutLabel }}</Badge>
        <Badge v-if="product.inStore" variant="success">{{ inStoreLabel }}</Badge>
      </div>
      <Button
        :variant="wishlisted ? 'solid' : 'outline'"
        color="neutral"
        size="icon-sm"
        class="absolute top-3 inset-e-3"
        :aria-label="wishlisted ? wishlistedLabel : wishlistLabel"
        :aria-pressed="wishlisted"
        @click="wishlist"
      >
        <IconPlaceholder lucide="HeartIcon" tabler="IconHeart" hugeicons="FavouriteIcon" phosphor="HeartIcon" remixicon="RiHeartLine" data-icon />
      </Button>
    </CardImage>

    <CardContent class="flex flex-1 flex-col gap-3">
      <div class="flex flex-col gap-1">
        <p v-if="eyebrow" data-slot="meta" class="fui-meta">{{ eyebrow }}</p>
        <h3 data-slot="product-card-title" :class="['fui-product-card-title', surface === 'bare' && 'group-hover:underline']">
          <a :href="href" class="outline-none focus-visible:fui-focus-ring">{{ product.name }}</a>
        </h3>
        <p v-if="product.description" data-slot="hint" class="fui-hint line-clamp-2">
          {{ product.description }}
        </p>
      </div>

      <div class="mt-auto flex flex-col gap-1">
        <div v-if="swatches.length" class="flex items-center gap-2">
          <SwatchGroup v-model="selectedSibling" type="single" size="xs" shape="pill" label-class="sr-only" :aria-label="colourLabel">
            <SwatchGroupItem v-for="sibling in swatches" :key="sibling.key" :value="sibling.key" :hex="sibling.colors?.exactColorHex" :label="sibling.colors?.exactColorName ?? sibling.name" />
          </SwatchGroup>
          <p v-if="moreColours > 0" data-slot="meta" class="fui-meta">{{ moreColoursLabel(moreColours) }}</p>
        </div>
        <Rating v-if="product.rating" :rating="product.rating" :label="ratingLabel" size="sm">
          <template v-if="product.reviewCount !== undefined" #meta>({{ product.reviewCount }})</template>
        </Rating>
        <Price :price="product.price" :locale="locale" />
      </div>
    </CardContent>
  </Card>
</template>

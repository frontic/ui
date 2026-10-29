<script lang="ts">
/** Shows a product with its image and price, with compare and wishlist buttons. */
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
import { SwatchGroup, SwatchGroupItem } from '@library/components/ui/swatch-group'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** The product to show: brand, name, description, price, cover, badges and colour siblings. */
    product: Product
    /** Shown on the button that adds the product to the comparison. */
    compareLabel?: string
    /** Shown on the compare button while the product is being compared. */
    comparingLabel?: string
    /** Screen-reader name of the heart button while the product is not on the wishlist. */
    wishlistLabel?: string
    /** Screen-reader name of the heart button while the product is on the wishlist. */
    wishlistedLabel?: string
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
    /** The photo's width over its height: 1 (square) when left out, `3 / 4` for portrait shots. */
    ratio?: number
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    ratio: 1,
    compareLabel: 'Compare',
    comparingLabel: 'Comparing',
    wishlistLabel: 'Add to wishlist',
    wishlistedLabel: 'Remove from wishlist',
    clearoutLabel: 'Clearout',
    inStoreLabel: 'In Store',
    colourLabel: 'Colour',
    moreColoursLabel: (count: number) => `+${count}`,
  },
)
const emit = defineEmits<{
  /** Fires with the product when the shopper toggles it for comparison. */
  compare: [product: Product]
  /** Fires with the product when the shopper toggles it on the wishlist. */
  wishlist: [product: Product]
}>()

const { selected: selectedSibling, cover } = useProductSibling(() => props.product)
const href = computed(() => props.product.link?.path ?? '#')
const SWATCHES = 5
const swatches = computed(() => props.product.siblings?.items?.slice(0, SWATCHES) ?? [])
const moreColours = computed(() => (props.product.siblings?.items?.length ?? 0) - swatches.value.length)

const comparing = ref(false)
const wishlisted = ref(false)

function compare() {
  comparing.value = !comparing.value
  emit('compare', props.product)
}

function wishlist() {
  wishlisted.value = !wishlisted.value
  emit('wishlist', props.product)
}
</script>

<template>
  <Card :surface="surface" :class="['group transition-shadow', surface === 'raised' && 'fui-product-card-lift', props.class]">
    <CardImage class="relative">
      <a :href="href" tabindex="-1" aria-hidden="true" class="block">
        <div data-slot="product-card-featured-image" class="fui-product-card-featured-image overflow-hidden">
          <AspectRatio :ratio="ratio">
            <Image :src="cover" :alt="product.name" class="size-full transition-transform duration-500 ease-out group-hover:scale-105" />
          </AspectRatio>
        </div>
      </a>
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
      <div v-if="product.badge || product.clearout || product.inStore" class="absolute top-3 inset-s-3 flex flex-col items-start gap-1">
        <Badge v-if="product.badge" variant="new">{{ product.badge }}</Badge>
        <Badge v-if="product.clearout" variant="discount">{{ clearoutLabel }}</Badge>
        <Badge v-if="product.inStore" variant="success">{{ inStoreLabel }}</Badge>
      </div>
    </CardImage>

    <CardContent class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-1">
          <p v-if="product.brand" data-slot="meta" class="fui-meta">
            {{ product.brand }}
          </p>
          <h3 data-slot="product-card-title" :class="['fui-product-card-title-lg', surface === 'bare' && 'group-hover:underline']">
            <a :href="href" class="outline-none focus-visible:fui-focus-ring">{{ product.name }}</a>
          </h3>
        </div>
        <p v-if="product.description" data-slot="product-card-featured-description" class="fui-product-card-featured-description">
          {{ product.description }}
        </p>
      </div>

      <div v-if="swatches.length" class="flex items-center gap-2">
        <SwatchGroup v-model="selectedSibling" type="single" size="xs" shape="pill" label-class="sr-only" :aria-label="colourLabel">
          <SwatchGroupItem v-for="sibling in swatches" :key="sibling.key" :value="sibling.key" :hex="sibling.colors?.exactColorHex" :label="sibling.colors?.exactColorName ?? sibling.name" />
        </SwatchGroup>
        <p v-if="moreColours > 0" data-slot="meta" class="fui-meta">{{ moreColoursLabel(moreColours) }}</p>
      </div>

      <div class="flex items-center justify-between gap-4">
        <Price size="lg" :price="product.price" :locale="locale" :show-discount="false" />
        <Button :variant="comparing ? 'solid' : 'outline'" color="neutral" size="sm" :aria-pressed="comparing" @click="compare">
          <IconPlaceholder v-if="comparing" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
          <IconPlaceholder
            v-else
            lucide="ArrowRightLeftIcon"
            tabler="IconArrowsLeftRight"
            hugeicons="ArrowDataTransferHorizontalIcon"
            phosphor="ArrowsLeftRightIcon"
            remixicon="RiArrowLeftRightLine"
            data-icon
          />
          {{ comparing ? comparingLabel : compareLabel }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

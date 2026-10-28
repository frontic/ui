<script lang="ts">
/** Lets the shopper choose colour, size and quantity, then add the product to the cart. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PriceType } from '@library/components/ui/price'
import type { ProductColour, ProductSelection, ProductSize } from './types'
import { computed, ref, watch } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@library/components/ui/field'
import { Image } from '@library/components/ui/image'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@library/components/ui/number-field'
import { Price } from '@library/components/ui/price'
import { Rating } from '@library/components/ui/rating'
import { SwatchGroup, SwatchGroupItem } from '@library/components/ui/swatch-group'
import { ToggleGroup, ToggleGroupItem } from '@library/components/ui/toggle-group'

const props = withDefaults(
  defineProps<{
    /** The product name, shown as the card's title. */
    title: string
    /** Shown under the title, such as a short product summary. */
    description?: string
    /** The product price, shown beside the image. */
    price: PriceType
    /** The product shot; the shown colour's own image replaces it when it has one. */
    image?: string
    /** Alt text of the product shot; the title when left out. */
    imageAlt?: string
    /** The average rating out of 5; no stars show when left out. */
    rating?: number
    /** How many reviews the rating is based on, shown beside the stars. */
    ratingCount?: number
    /** The colours to choose from as swatches; the colour picker hides when empty. */
    colours?: ProductColour[]
    /** The sizes to choose from; the size picker hides when empty. */
    sizes?: ProductSize[]
    /** The most the quantity stepper allows. */
    maxQuantity?: number
    /** Shown above the colour swatches. */
    colourLabel?: string
    /** Shown above the size buttons, and read before each size by screen readers. */
    sizeLabel?: string
    /** Shown above the quantity stepper. */
    quantityLabel?: string
    /** Shown on the button that adds the selection to the cart. */
    addToCartLabel?: string
    /** Shown under the sizes when the shopper adds to the cart before choosing one. */
    sizeRequiredLabel?: string
    /** Read after a sold-out colour's name, and shown under the colours when the shopper adds a sold-out one to the cart. */
    colourUnavailableLabel?: string
    /** BCP 47 locale the price is formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Screen-reader label of the heart button that saves the product to the wishlist. */
    wishlistLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    colours: () => [],
    sizes: () => [],
    maxQuantity: 10,
    colourLabel: 'Colour',
    sizeLabel: 'Size',
    quantityLabel: 'Quantity',
    addToCartLabel: 'Add to cart',
    sizeRequiredLabel: 'Choose a size',
    colourUnavailableLabel: 'Sold out',
    wishlistLabel: 'Save to wishlist',
  },
)
const emit = defineEmits<{
  /** Fires with the chosen colour, size and quantity when the shopper adds the product to the cart. */
  addToCart: [selection: ProductSelection]
  /** Fires when the shopper clicks the wishlist button. */
  wishlist: []
}>()

/** The selected colour, by value; the first colour shows when none is. */
const colour = defineModel<string>('colour')
/** The selected size, by value. */
const size = defineModel<string>('size')
/** How many the shopper adds to the cart. */
const quantity = defineModel<number>('quantity', { default: 1 })

const shown = computed(() => props.colours.find((c) => c.value === colour.value) ?? props.colours[0])
const image = computed(() => shown.value?.image ?? props.image)
const alt = computed(() => shown.value?.alt ?? props.imageAlt ?? props.title)

const sizeMissing = ref(false)
watch(size, () => (sizeMissing.value = false))
const colourSoldOut = ref(false)
watch(colour, () => (colourSoldOut.value = false))

function addToCart() {
  colourSoldOut.value = Boolean(shown.value?.unavailable)
  sizeMissing.value = Boolean(props.sizes.length && !size.value)
  if (colourSoldOut.value || sizeMissing.value) return
  emit('addToCart', { colour: colour.value ?? shown.value?.value, size: size.value, quantity: quantity.value })
}
</script>

<template>
  <Card :surface="surface" :class="['@container', props.class]">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction class="col-start-2 row-span-2 row-start-1 justify-self-end">
        <Button variant="ghost" color="neutral" size="icon-sm" :aria-label="wishlistLabel" @click="emit('wishlist')">
          <IconPlaceholder lucide="HeartIcon" tabler="IconHeart" hugeicons="FavouriteIcon" phosphor="HeartIcon" remixicon="RiHeartLine" data-icon />
        </Button>
      </CardAction>
    </CardHeader>
    <CardContent>
      <FieldGroup>
        <div class="flex items-center gap-4">
          <div v-if="image" class="size-16 shrink-0 @sm:size-24">
            <div data-slot="product-options-image" class="fui-product-options-image size-full overflow-hidden">
              <Image :src="image" :alt="alt" class="size-full" />
            </div>
          </div>
          <div class="flex min-w-0 flex-col gap-2">
            <Price :price="price" size="lg" :locale="locale" />
            <Rating v-if="rating !== undefined" :rating="rating" :count="ratingCount" show-value class="flex-wrap" />
          </div>
        </div>
        <Field v-if="colours.length" :invalid="colourSoldOut">
          <FieldLabel :native-label="false">{{ colourLabel }}</FieldLabel>
          <SwatchGroup :model-value="shown?.value" type="single" @update:model-value="colour = ($event as string) || colour">
            <SwatchGroupItem v-for="c in colours" :key="c.value" :value="c.value" :hex="c.hex" :label="c.label" :unavailable="c.unavailable" :unavailable-label="colourUnavailableLabel" />
          </SwatchGroup>
          <FieldError v-if="colourSoldOut" :errors="[colourUnavailableLabel]" />
        </Field>
        <Field v-if="sizes.length" :invalid="sizeMissing">
          <FieldLabel>{{ sizeLabel }}</FieldLabel>
          <ToggleGroup :model-value="size ?? ''" type="single" variant="outline" class="w-full @sm:w-auto" @update:model-value="size = ($event as string) || size">
            <ToggleGroupItem v-for="s in sizes" :key="s.value" :value="s.value" :aria-label="`${sizeLabel} ${s.label ?? s.value}`" :disabled="s.disabled" class="min-w-0 flex-1 @sm:flex-none">
              {{ s.label ?? s.value }}
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldError v-if="sizeMissing" :errors="[sizeRequiredLabel]" />
        </Field>
        <Field>
          <FieldLabel>{{ quantityLabel }}</FieldLabel>
          <NumberField v-model="quantity" :min="1" :max="maxQuantity">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </Field>
      </FieldGroup>
    </CardContent>
    <CardFooter>
      <Button color="buy" class="w-full" @click="addToCart">{{ addToCartLabel }}</Button>
    </CardFooter>
  </Card>
</template>

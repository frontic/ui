<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, provide, toRef } from 'vue'
import { cva } from 'class-variance-authority'
import { type PriceType, formatPrice, percentOf } from '@library/lib/format'
import { type PriceAlign, type PriceSize, PRICE_INJECTION_KEY } from '.'
import PriceAmount from './PriceAmount.vue'
import PriceRef from './PriceRef.vue'
import PriceDiscount from './PriceDiscount.vue'
import PriceHint from './PriceHint.vue'
import { useLocale } from 'reka-ui'

const root = cva('fui-price tabular-nums', {
  variants: {
    size: { sm: 'fui-price-sm', md: 'fui-price-md', lg: 'fui-price-lg' },
    align: { start: 'fui-price-start', end: 'fui-price-end' },
  },
  defaultVariants: { size: 'md', align: 'start' },
})

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The text size of the price. */
    size?: PriceSize
    /** Which side the badge, the prices and the hint line up on. */
    align?: PriceAlign
    /** The price to show: `amount` and `ref` in minor units such as cents, `currency` as an ISO 4217 code. */
    price: PriceType
    /** The locale that formats the price, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Shows the reference price struck through when it is higher than the amount. */
    showRef?: boolean
    /** Shows the saving as a percentage next to a discounted price. */
    showDiscount?: boolean
    /** Shows the hint below the price when the hint slot holds one. */
    showHint?: boolean
    /** Read out before the original price of a reduced product; hidden on screen. */
    refLabel?: string
    /** Read out before the current price of a reduced product; hidden on screen. */
    amountLabel?: string
  }>(),
  {
    size: 'md',
    align: 'start',
    showRef: true,
    showDiscount: true,
    showHint: true,
    refLabel: 'Was',
    amountLabel: 'Now',
  },
)
const locale = useLocale(toRef(() => props.locale))

const fmt = (amount: number) => formatPrice({ ...props.price, amount }, locale.value)

const amount = computed(() => props.price.amount ?? 0)
const refPrice = computed(() => props.price.ref ?? 0)
const isDiscounted = computed(() => props.showRef && refPrice.value > amount.value)
const formattedPrice = computed(() => fmt(amount.value))
const formattedRef = computed(() => (isDiscounted.value ? fmt(refPrice.value) : ''))
const discountPercent = computed(() => (isDiscounted.value && props.showDiscount ? percentOf(refPrice.value - amount.value, refPrice.value) : 0))

defineSlots<{
  /** Replaces the badge and the price row; compose PriceDiscount, PriceRef and PriceAmount in any order. */
  default?: () => unknown
  /** A note below the price, such as tax and shipping. */
  hint?: () => unknown
}>()

provide(PRICE_INJECTION_KEY, {
  formattedPrice,
  formattedRef,
  isDiscounted,
  discountPercent,
  size: computed(() => props.size),
  refLabel: computed(() => props.refLabel),
  amountLabel: computed(() => props.amountLabel),
})
</script>

<template>
  <span data-slot="price" :class="[root({ size, align }), props.class]">
    <slot>
      <PriceDiscount />
      <span data-slot="price-row" class="fui-price-row inline-flex flex-wrap items-baseline">
        <PriceRef />
        <PriceAmount />
      </span>
    </slot>
    <PriceHint v-if="props.showHint && $slots.hint"><slot name="hint" /></PriceHint>
  </span>
</template>

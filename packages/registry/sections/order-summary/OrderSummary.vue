<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the order's items with subtotal, discounts, shipping, tax and total. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { type AppliedDiscount, discounted, itemCount, lineTotal, MINUS_SIGN, subtotal } from '@library/lib/cart'
import type { PriceType } from '@library/lib/format'
import { computed } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@library/components/ui/card'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'

const props = withDefaults(
  defineProps<{
    /** The products in the order, one row each. */
    items?: CartLine[]
    /** ISO 4217 code for the totals; the first item's currency wins when there is one. */
    currency?: string
    /** Shipping in minor units; 0 shows the free badge. */
    shippingCents?: number
    /** Shown in place of the shipping cost, e.g. until a shipping method is chosen. */
    shippingNote?: string
    /** Codes and gift cards taken off the order, one row each below the subtotal. */
    discounts?: AppliedDiscount[]
    /** Tax in minor units, added to the total. */
    taxCents?: number
    /** Shows the tax row; the tax is added to the total either way. */
    showTax?: boolean
    /** Shows the heading, description and item count; leave it off where something around the card already names it. */
    showHeader?: boolean
    /** Shows the total row; leave it off where something around the card already shows the total. */
    showTotal?: boolean
    /** The card's heading. */
    title?: string
    /** Shown under the heading. */
    description?: string
    /** Builds the badge beside the heading from the number of items; no badge when left out. */
    countLabel?: (count: number) => string
    /** Builds each row's quantity text from its quantity. */
    quantityLabel?: (quantity: number) => string
    /** Shown beside the sum of the items. */
    subtotalLabel?: string
    /** Shown beside the shipping cost. */
    shippingLabel?: string
    /** Shown on the badge in place of the shipping cost when shipping is free. */
    freeShippingLabel?: string
    /** Shown beside the tax. */
    taxLabel?: string
    /** Shown beside the order total. */
    totalLabel?: string
    /** Put before each amount a discount takes off. */
    minusSign?: string
    /** Shown under the total's label, e.g. whether VAT is included. */
    totalNote?: string
    /** BCP 47 locale the prices are formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    items: () => [],
    currency: 'EUR',
    shippingCents: 0,
    discounts: () => [],
    taxCents: 0,
    showTax: true,
    showHeader: true,
    showTotal: true,
    title: 'Order Summary',
    quantityLabel: (quantity: number) => `Qty: ${quantity}`,
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    freeShippingLabel: 'Free',
    taxLabel: 'Tax',
    totalLabel: 'Total',
    minusSign: MINUS_SIGN,
  },
)
defineSlots<{
  /** Replaces the heading's text, e.g. to wrap it in a heading element. */
  title?: () => unknown
  /** Replaces how each order line renders; gets the line. */
  line?: (props: { line: CartLine }) => unknown
  /** Sits between the lines and the totals, e.g. a PromoCodeField. */
  codes?: () => unknown
}>()

const itemsTotal = computed(() => subtotal(props.items, props.currency))
const count = computed(() => itemCount(props.items))
const money = (amount: number): PriceType => ({ ...itemsTotal.value, amount })
const total = computed(() => discounted(itemsTotal.value, props.discounts).amount + props.shippingCents + props.taxCents)
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader v-if="showHeader">
      <CardTitle
        ><slot name="title">{{ title }}</slot></CardTitle
      >
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction v-if="countLabel && count">
        <Badge variant="primary" size="sm">{{ countLabel(count) }}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent class="flex flex-col gap-5">
      <div class="flex flex-col gap-4">
        <template v-for="line in items" :key="line.id">
          <slot name="line" :line="line">
            <div class="flex items-center gap-4">
              <div data-slot="order-summary-image" class="fui-order-summary-image shrink-0 overflow-hidden">
                <Image :src="line.image ?? '/placeholder.svg'" :alt="line.name" class="size-full" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <h3 data-slot="line-title" class="fui-line-title truncate">{{ line.name }}</h3>
                <span data-slot="meta" class="fui-meta">
                  <template v-if="line.variant">{{ line.variant }} · </template>{{ quantityLabel(line.quantity) }}
                </span>
              </div>
              <Price align="end" size="sm" :price="lineTotal(line)" :locale="locale" :show-discount="false" class="shrink-0" />
            </div>
          </slot>
        </template>
      </div>

      <template v-if="$slots.codes">
        <Separator />
        <slot name="codes" />
      </template>

      <Separator />

      <dl class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ subtotalLabel }}</dt>
          <dd><Price align="end" size="sm" :price="itemsTotal" :locale="locale" /></dd>
        </div>
        <div v-for="discount in discounts" :key="discount.id" class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ discount.lineLabel ?? discount.label }}</dt>
          <dd class="flex items-center">{{ minusSign }}<Price align="end" size="sm" :price="money(discount.amount)" :locale="locale" /></dd>
        </div>
        <div class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ shippingLabel }}</dt>
          <dd>
            <span v-if="shippingNote" data-slot="meta" class="fui-meta">{{ shippingNote }}</span>
            <Badge v-else-if="shippingCents === 0" variant="success" size="sm">{{ freeShippingLabel }}</Badge>
            <Price align="end" v-else size="sm" :price="money(shippingCents)" :locale="locale" />
          </dd>
        </div>
        <div v-if="showTax" class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ taxLabel }}</dt>
          <dd><Price align="end" size="sm" :price="money(taxCents)" :locale="locale" /></dd>
        </div>
      </dl>

      <template v-if="showTotal">
        <Separator />

        <div data-slot="total" class="fui-total flex items-end justify-between">
          <div class="flex flex-col">
            <span>{{ totalLabel }}</span>
            <span v-if="totalNote" data-slot="meta" class="fui-meta">{{ totalNote }}</span>
          </div>
          <Price align="end" size="lg" :price="money(total)" :locale="locale" />
        </div>
      </template>
    </CardContent>
  </Card>
</template>

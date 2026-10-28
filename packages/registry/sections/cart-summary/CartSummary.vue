<script lang="ts">
/** Shows the cart's lines with subtotal, shipping and total, and a button to check out. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PriceType } from '@library/components/ui/price'
import type { CartSummaryLine } from './types'
import { itemCount, lineTotal, savings, subtotal } from '@library/lib/cart'
import { computed } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Image } from '@library/components/ui/image'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@library/components/ui/item'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'

const props = withDefaults(
  defineProps<{
    /** The products in the cart, one row each. */
    lines: CartSummaryLine[]
    /** The card's heading. */
    title?: string
    /** Shown under the heading. */
    description?: string
    /** ISO 4217 code for the totals; the first line's currency wins when there is one. */
    currency?: string
    /** Shipping in minor units; 0 shows the free badge, and left out it reads as worked out at checkout and stays out of the total. */
    shippingCents?: number
    /** Builds the badge beside the heading from the number of items in the cart. */
    countLabel?: (count: number) => string
    /** Builds each line's quantity text from its quantity. */
    quantityLabel?: (quantity: number) => string
    /** Shown beside the sum of the lines. */
    subtotalLabel?: string
    /** Shown beside the shipping cost. */
    shippingLabel?: string
    /** Shown on the badge in place of the shipping cost when shipping is free. */
    freeShippingLabel?: string
    /** Shown in place of the shipping cost while it isn't known yet. */
    shippingPendingLabel?: string
    /** Shown in place of the lines when the cart is empty. */
    emptyLabel?: string
    /** Shown beside the amount saved; the row shows only when a line is reduced. */
    savingsLabel?: string
    /** Shown beside the order total. */
    totalLabel?: string
    /** Shown under the total's label, e.g. whether VAT is included. */
    taxNote?: string
    /** Shown on the button that goes to checkout. */
    checkoutLabel?: string
    /** BCP 47 locale the prices are formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Your cart',
    currency: 'EUR',
    countLabel: (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`,
    quantityLabel: (quantity: number) => `Qty ${quantity}`,
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    freeShippingLabel: 'Free',
    shippingPendingLabel: 'Calculated at checkout',
    emptyLabel: 'Your cart is empty.',
    savingsLabel: 'You save',
    totalLabel: 'Total',
    taxNote: 'Incl. VAT',
    checkoutLabel: 'Secure checkout',
  },
)
const emit = defineEmits<{
  /** Fires when the shopper clicks the checkout button; it stays off while the cart is empty. */
  checkout: []
}>()

const itemsTotal = computed(() => subtotal(props.lines, props.currency))
const money = (amount: number): PriceType => ({ ...itemsTotal.value, amount })
const count = computed(() => itemCount(props.lines))
const saved = computed(() => savings(props.lines, props.currency).amount)
const total = computed(() => itemsTotal.value.amount + (props.shippingCents ?? 0))
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction v-if="count" class="col-start-2 row-span-2 row-start-1 justify-self-end">
        <Badge variant="primary" size="sm">{{ countLabel(count) }}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p v-if="!lines.length" data-slot="hint" class="fui-hint">{{ emptyLabel }}</p>
      <ItemGroup v-else>
        <Item v-for="line in lines" :key="line.id" size="sm" class="flex-nowrap px-0">
          <ItemMedia v-if="line.image" variant="image">
            <Image :src="line.image" :alt="line.name" />
          </ItemMedia>
          <ItemContent class="min-w-0">
            <ItemTitle>
              <a v-if="line.link" :href="line.link.path" class="outline-none hover:underline focus-visible:fui-focus-ring">{{ line.name }}</a>
              <template v-else>{{ line.name }}</template>
            </ItemTitle>
            <ItemDescription>
              <template v-if="line.variant">{{ line.variant }} · </template>{{ quantityLabel(line.quantity) }}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Price :price="lineTotal(line)" size="sm" :show-discount="false" :locale="locale" align="end" />
          </ItemActions>
        </Item>
      </ItemGroup>
    </CardContent>
    <CardFooter class="flex-col items-stretch gap-4">
      <Separator />
      <dl class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ subtotalLabel }}</dt>
          <dd><Price align="end" :price="itemsTotal" size="sm" :locale="locale" /></dd>
        </div>
        <div class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ shippingLabel }}</dt>
          <dd>
            <Badge v-if="shippingCents === 0" variant="success" size="sm">{{ freeShippingLabel }}</Badge>
            <span v-else-if="shippingCents === undefined" data-slot="meta" class="fui-meta">{{ shippingPendingLabel }}</span>
            <Price v-else align="end" :price="money(shippingCents)" size="sm" :locale="locale" />
          </dd>
        </div>
        <div v-if="saved > 0" class="flex items-center justify-between">
          <dt data-slot="hint" class="fui-hint">{{ savingsLabel }}</dt>
          <dd><Price align="end" :price="money(saved)" size="sm" :locale="locale" /></dd>
        </div>
      </dl>
      <Separator />
      <dl class="flex items-baseline justify-between">
        <dt class="flex flex-col">
          <span data-slot="heading" class="fui-heading">{{ totalLabel }}</span>
          <span v-if="taxNote" data-slot="meta" class="fui-meta">{{ taxNote }}</span>
        </dt>
        <dd><Price align="end" :price="money(total)" size="lg" :locale="locale" /></dd>
      </dl>
      <Button color="checkout" class="w-full" :disabled="!lines.length" @click="emit('checkout')">
        <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
        {{ checkoutLabel }}
      </Button>
    </CardFooter>
  </Card>
</template>

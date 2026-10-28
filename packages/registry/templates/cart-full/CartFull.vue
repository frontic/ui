<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the full cart page with editable items, an order summary and a checkout button. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { savings, shippingFor, subtotal } from '@library/lib/cart'
import type { PriceType } from '@library/lib/format'
import { computed } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@library/components/ui/empty'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { CartItemDetailed } from '@library/components/templates/cart-item-detailed'

const props = withDefaults(
  defineProps<{
    /** ISO 4217 code for the totals; the first item's currency takes precedence. */
    currency?: string
    /** Subtotal in minor units from which shipping is free, exactly at it included. */
    freeShippingThreshold?: number
    /** Shipping charged in cents while the subtotal is at or below the free-shipping threshold. */
    shippingCost?: number
    /** Builds the page heading from the number of lines in the cart. */
    title?: (count: number) => string
    /** Shown as the heading of the order summary card. */
    summaryTitle?: string
    /** Shown next to the subtotal in the order summary. */
    subtotalLabel?: string
    /** Shown next to the shipping cost in the order summary. */
    shippingLabel?: string
    /** Shown in the badge that replaces the shipping cost once shipping is free. */
    freeShippingLabel?: string
    /** Shown next to the amount saved on reduced items; the row hides when nothing is saved. */
    savingsLabel?: string
    /** Shown next to the order total. */
    totalLabel?: string
    /** Shown under the total's label, e.g. `Incl. VAT`; hidden when empty. */
    taxNote?: string
    /** Shown on the button that starts checkout. */
    checkoutLabel?: string
    /** Shown on the link under checkout and on the empty state's button; both emit `continue-shopping`. */
    continueLabel?: string
    /** Shown as the heading when the cart is empty. */
    emptyTitle?: string
    /** Shown under the heading when the cart is empty. */
    emptyText?: string
    /** Highest quantity a shopper can set on one item. */
    maxQuantity?: number
    /** Builds the screen-reader name of an item's remove button from the item's name. */
    removeLabel?: (name: string) => string
    /** Builds the screen-reader name of the button that lowers an item's quantity from the item's name. */
    decreaseLabel?: (name: string) => string
    /** Builds the screen-reader name of the button that raises an item's quantity from the item's name. */
    increaseLabel?: (name: string) => string
    /** Builds the unit-price line from the formatted price; shows when an item's quantity is above 1. */
    eachLabel?: (price: string) => string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    currency: 'EUR',
    freeShippingThreshold: 10000,
    shippingCost: 599,
    title: (count: number) => `Shopping Cart (${count})`,
    summaryTitle: 'Order Summary',
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    freeShippingLabel: 'Free',
    savingsLabel: 'You save',
    totalLabel: 'Total',
    taxNote: 'Incl. VAT',
    checkoutLabel: 'Checkout',
    continueLabel: 'Continue Shopping',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Add some items to get started.',
  },
)
const emit = defineEmits<{
  /** Fires with the cart lines when the shopper clicks the checkout button. */
  checkout: [items: CartLine[]]
  /** Fires when the shopper chooses to continue shopping. */
  'continue-shopping': []
}>()
/** The cart's lines; quantity changes and removals update it. */
const items = defineModel<CartLine[]>('items', { default: () => [] })

const itemsTotal = computed(() => subtotal(items.value, props.currency))
const money = (amount: number): PriceType => ({ ...itemsTotal.value, amount })
const saved = computed(() => savings(items.value, props.currency).amount)
const shipping = computed(() => shippingFor(itemsTotal.value, props.shippingCost, props.freeShippingThreshold).amount)
const total = computed(() => itemsTotal.value.amount + shipping.value)
</script>

<template>
  <div :class="['fui-cart-full @container', props.class]">
    <h1 data-slot="page-title" class="fui-page-title">{{ title(items.length) }}</h1>

    <div v-if="items.length" class="flex flex-col gap-6 @3xl:flex-row">
      <CartItemDetailed
        v-model:items="items"
        :max-quantity="maxQuantity"
        :remove-label="removeLabel"
        :decrease-label="decreaseLabel"
        :increase-label="increaseLabel"
        :each-label="eachLabel"
        :locale="locale"
        class="min-w-0 flex-1"
      />

      <Card class="h-fit shrink-0 @3xl:w-80">
        <CardHeader>
          <CardTitle>{{ summaryTitle }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between">
            <span data-slot="hint" class="fui-hint">{{ subtotalLabel }}</span>
            <Price align="end" :price="itemsTotal" :locale="locale" />
          </div>
          <div class="flex justify-between">
            <span data-slot="hint" class="fui-hint">{{ shippingLabel }}</span>
            <Badge v-if="shipping === 0" variant="success" size="sm">{{ freeShippingLabel }}</Badge>
            <Price align="end" v-else :price="money(shipping)" :locale="locale" />
          </div>
          <div v-if="saved > 0" class="flex justify-between">
            <span data-slot="hint" class="fui-hint">{{ savingsLabel }}</span>
            <Price align="end" :price="money(saved)" :locale="locale" />
          </div>
          <div data-slot="total" class="fui-total">
            <Separator />
            <div class="flex justify-between pt-3">
              <div class="flex flex-col">
                <span>{{ totalLabel }}</span>
                <span v-if="taxNote" data-slot="meta" class="fui-meta">{{ taxNote }}</span>
              </div>
              <Price align="end" size="lg" :price="money(total)" :locale="locale" />
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-2">
          <Button color="checkout" class="w-full" @click="emit('checkout', items)">
            <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
            {{ checkoutLabel }}
          </Button>
          <Button variant="link" class="w-full" @click="emit('continue-shopping')">{{ continueLabel }}</Button>
        </CardFooter>
      </Card>
    </div>

    <Empty v-else>
      <EmptyHeader>
        <EmptyMedia variant="icon"
          ><IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" data-icon
        /></EmptyMedia>
        <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
        <EmptyDescription>{{ emptyText }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button @click="emit('continue-shopping')">{{ continueLabel }}</Button>
      </EmptyContent>
    </Empty>
  </div>
</template>

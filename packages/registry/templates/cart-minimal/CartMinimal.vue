<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Opens a popover with the cart's first items, subtotal and checkout. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { itemCount, subtotal } from '@library/lib/cart'
import { computed } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@library/components/ui/empty'
import { Popover, PopoverContent, PopoverTrigger } from '@library/components/ui/popover'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { CartItemMinimal } from '@library/components/templates/cart-item-minimal'

const props = withDefaults(
  defineProps<{
    /** The cart's lines; the popover lists the first few. */
    items?: CartLine[]
    /** ISO 4217 code for the totals; the first item's currency takes precedence. */
    currency?: string
    /** How many items the popover lists before summing up the rest in one line. */
    maxVisibleItems?: number
    /** Builds the popover's heading from the total quantity in the cart. */
    title?: (count: number) => string
    /** Screen-reader name of the cart button that opens the popover; the count badge's text follows it. */
    openLabel?: string
    /** Builds the badge on the cart button from the total quantity, e.g. `9+`. */
    countLabel?: (count: number) => string
    /** Builds the line under the list from the number of items left out, e.g. `+ 2 more items`. */
    moreLabel?: (count: number) => string
    /** Shown next to the subtotal in the popover. */
    subtotalLabel?: string
    /** Shown under the subtotal, e.g. that shipping and taxes follow at checkout. */
    taxNote?: string
    /** Shown on the button that starts checkout. */
    checkoutLabel?: string
    /** Shown on the button that emits `view-cart` to open the full cart. */
    viewCartLabel?: string
    /** Shown as the heading when the cart is empty. */
    emptyTitle?: string
    /** Shown under the heading when the cart is empty. */
    emptyText?: string
    /** Builds the quantity text next to the variant, e.g. `Qty 2`. */
    quantityLabel?: (quantity: number) => string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    items: () => [],
    currency: 'EUR',
    maxVisibleItems: 3,
    title: (count: number) => `Cart (${count})`,
    openLabel: 'Open cart',
    countLabel: (count: number) => (count > 9 ? '9+' : String(count)),
    moreLabel: (count: number) => `+ ${count} more ${count === 1 ? 'item' : 'items'}`,
    subtotalLabel: 'Subtotal',
    taxNote: 'Shipping and taxes calculated at checkout.',
    checkoutLabel: 'Checkout',
    viewCartLabel: 'View cart',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Add some items to get started.',
  },
)
const emit = defineEmits<{
  /** Fires with the cart lines when the shopper clicks the checkout button. */
  checkout: [items: CartLine[]]
  /** Fires when the shopper clicks the button to view the full cart. */
  'view-cart': []
}>()
/** Whether the cart popover is open. */
const open = defineModel<boolean>('open', { default: false })

const count = computed(() => itemCount(props.items))
const itemsTotal = computed(() => subtotal(props.items, props.currency))
const visible = computed(() => props.items.slice(0, props.maxVisibleItems))
const hidden = computed(() => Math.max(props.items.length - props.maxVisibleItems, 0))
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="ghost" color="neutral" size="icon-md" :aria-label="count > 0 ? `${openLabel} (${countLabel(count)})` : openLabel" :class="['relative', props.class]">
        <IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" class="size-5" />
        <Badge v-if="count > 0" variant="primary" size="sm" class="absolute -top-1 -inset-e-1">{{ countLabel(count) }}</Badge>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="end" :aria-label="title(count)" class="@container w-80 p-0">
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <span data-slot="cart-minimal-title" class="fui-cart-minimal-title">{{ title(count) }}</span>
      </div>

      <div v-if="items.length" class="flex flex-col gap-3 px-4 pb-3">
        <CartItemMinimal :items="visible" :quantity-label="quantityLabel" :locale="locale" />
        <p v-if="hidden > 0" data-slot="meta" class="fui-meta">{{ moreLabel(hidden) }}</p>
      </div>

      <Empty v-else>
        <EmptyHeader>
          <EmptyMedia variant="icon"
            ><IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" data-icon
          /></EmptyMedia>
          <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
          <EmptyDescription>{{ emptyText }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <template v-if="items.length">
        <Separator />
        <div class="flex flex-col gap-2 p-4">
          <div class="flex items-center justify-between">
            <span data-slot="hint" class="fui-hint">{{ subtotalLabel }}</span>
            <Price align="end" :price="itemsTotal" :locale="locale" />
          </div>
          <p data-slot="meta" class="fui-meta">{{ taxNote }}</p>
          <div class="mt-1 flex flex-col gap-2">
            <Button color="checkout" size="sm" class="w-full" @click="emit('checkout', items)">
              <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
              {{ checkoutLabel }}
            </Button>
            <Button variant="outline" color="neutral" size="sm" class="w-full" @click="emit('view-cart')">{{ viewCartLabel }}</Button>
          </div>
        </div>
      </template>
    </PopoverContent>
  </Popover>
</template>

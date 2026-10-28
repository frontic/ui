<script lang="ts">
/** Opens a side sheet with the cart's items, quantity controls, free-shipping progress and checkout. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { itemCount, subtotal } from '@library/lib/cart'
import { percentOf, type PriceType } from '@library/lib/format'
import { computed } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@library/components/ui/empty'
import { Price } from '@library/components/ui/price'
import { Progress } from '@library/components/ui/progress'
import { Separator } from '@library/components/ui/separator'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@library/components/ui/sheet'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { CartItemCompact } from '@library/components/templates/cart-item-compact'

const props = withDefaults(
  defineProps<{
    /** ISO 4217 code for the totals; the first item's currency takes precedence. */
    currency?: string
    /** Subtotal in cents at which shipping turns free; the progress bar fills towards it. */
    freeShippingThreshold?: number
    /** Builds the sheet's heading from the total quantity in the cart. */
    title?: (count: number) => string
    /** Screen-reader name of the cart button that opens the sheet; the count badge's text follows it. */
    openLabel?: string
    /** Builds the badge on the cart button from the total quantity, e.g. `9+`. */
    countLabel?: (count: number) => string
    /** Screen-reader name of the button that closes the sheet. */
    closeLabel?: string
    /** Shown above the progress bar until shipping is free; `{amount}` stands for the amount still missing. */
    freeShippingProgressLabel?: string
    /** Shown above the progress bar once the subtotal reaches free shipping. */
    freeShippingReachedLabel?: string
    /** Screen-reader name of the free-shipping progress bar. */
    freeShippingProgressAria?: string
    /** Shown next to the subtotal in the sheet's footer. */
    subtotalLabel?: string
    /** Shown under the subtotal, e.g. that shipping and taxes follow at checkout. */
    taxNote?: string
    /** Shown on the button that starts checkout. */
    checkoutLabel?: string
    /** Shown on the buttons that close the sheet so the shopper keeps browsing. */
    continueLabel?: string
    /** Shown as the heading when the cart is empty. */
    emptyTitle?: string
    /** Shown under the heading when the cart is empty. */
    emptyText?: string
    /** Highest quantity a shopper can set on one item. */
    maxQuantity?: number
    /** Builds the screen-reader name of an item's remove button from the item's name. */
    removeLabel?: (name: string) => string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    currency: 'EUR',
    freeShippingThreshold: 15000,
    title: (count: number) => `Cart (${count})`,
    openLabel: 'Open cart',
    countLabel: (count: number) => (count > 9 ? '9+' : String(count)),
    closeLabel: 'Close',
    freeShippingProgressLabel: 'Add {amount} more for free shipping',
    freeShippingReachedLabel: 'You qualify for free shipping!',
    freeShippingProgressAria: 'Progress to free shipping',
    subtotalLabel: 'Subtotal',
    taxNote: 'Shipping and taxes calculated at checkout.',
    checkoutLabel: 'Checkout',
    continueLabel: 'Continue shopping',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Add some items to get started.',
  },
)
const emit = defineEmits<{
  /** Fires with the cart lines when the shopper clicks the checkout button. */
  checkout: [items: CartLine[]]
}>()
/** The cart's lines; quantity changes and removals update it. */
const items = defineModel<CartLine[]>('items', { default: () => [] })
/** Whether the cart sheet is open. */
const open = defineModel<boolean>('open', { default: false })

const count = computed(() => itemCount(items.value))
const itemsTotal = computed(() => subtotal(items.value, props.currency))
const money = (amount: number): PriceType => ({ ...itemsTotal.value, amount })
const progress = computed(() => Math.min(percentOf(itemsTotal.value.amount, props.freeShippingThreshold), 100))
// Free at exactly the threshold, as shippingFor rules.
const remaining = computed(() => Math.max(props.freeShippingThreshold - itemsTotal.value.amount, 0))
const progressLabel = computed(() => {
  const [before = '', after = ''] = props.freeShippingProgressLabel.split('{amount}')
  return { before, after }
})
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button variant="ghost" color="neutral" size="icon-md" :aria-label="count > 0 ? `${openLabel} (${countLabel(count)})` : openLabel" :class="['relative', props.class]">
        <IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" class="size-5" />
        <Badge v-if="count > 0" variant="primary" size="sm" class="absolute -top-1 -inset-e-1">{{ countLabel(count) }}</Badge>
      </Button>
    </SheetTrigger>

    <SheetContent side="end" :show-close-button="false">
      <div>
        <SheetHeader>
          <div class="flex items-center justify-between">
            <SheetTitle class="sr-only">{{ title(count) }}</SheetTitle>
            <p data-slot="part-title-lg" class="fui-part-title-lg" aria-hidden="true">{{ title(count) }}</p>
            <SheetClose as-child>
              <Button variant="ghost" color="neutral" size="icon-sm" :aria-label="closeLabel">
                <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <Separator />
      </div>

      <div v-if="items.length" class="flex flex-col gap-2 px-6 pt-4">
        <p v-if="remaining > 0" data-slot="hint" class="fui-hint">{{ progressLabel.before }}<Price size="sm" :price="money(remaining)" :locale="locale" />{{ progressLabel.after }}</p>
        <p v-else data-slot="hint" class="fui-hint">
          <span data-slot="note-positive" class="fui-note-positive">{{ freeShippingReachedLabel }}</span>
        </p>
        <Progress :model-value="progress" :aria-label="freeShippingProgressAria" />
      </div>

      <div class="@container flex-1 overflow-y-auto px-6 py-5">
        <CartItemCompact v-if="items.length" v-model:items="items" :max-quantity="maxQuantity" :remove-label="removeLabel" :locale="locale" />

        <Empty v-else>
          <EmptyHeader>
            <EmptyMedia variant="icon"
              ><IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" data-icon
            /></EmptyMedia>
            <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
            <EmptyDescription>{{ emptyText }}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <SheetClose as-child>
              <Button variant="outline" color="neutral">{{ continueLabel }}</Button>
            </SheetClose>
          </EmptyContent>
        </Empty>
      </div>

      <div v-if="items.length">
        <Separator />
        <SheetFooter>
          <div class="flex w-full flex-col gap-3">
            <div class="flex items-center justify-between">
              <span data-slot="hint" class="fui-hint">{{ subtotalLabel }}</span>
              <Price align="end" :price="itemsTotal" :locale="locale" />
            </div>
            <p data-slot="meta" class="fui-meta">{{ taxNote }}</p>
            <Button color="checkout" class="w-full" @click="emit('checkout', items)">
              <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
              {{ checkoutLabel }}
            </Button>
            <SheetClose as-child>
              <Button variant="outline" color="neutral" class="w-full">{{ continueLabel }}</Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { clampQuantity, lineTotal } from '@library/lib/cart'
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { formatPrice } from '@library/lib/format'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { useLocale } from 'reka-ui'
import { toRef } from 'vue'

const props = withDefaults(
  defineProps<{
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
    maxQuantity: 10,
    removeLabel: (name: string) => `Remove ${name}`,
    decreaseLabel: (name: string) => `Decrease quantity of ${name}`,
    increaseLabel: (name: string) => `Increase quantity of ${name}`,
    eachLabel: (price: string) => `${price} each`,
  },
)
const locale = useLocale(toRef(() => props.locale))
/** The cart's lines; quantity changes and removals update it. */
const items = defineModel<CartLine[]>('items', { default: () => [] })

function setQuantity(id: string, quantity: number) {
  items.value = items.value.map((line) => (line.id === id ? { ...line, quantity: clampQuantity(quantity, props.maxQuantity) } : line))
}

function remove(id: string) {
  items.value = items.value.filter((line) => line.id !== id)
}
</script>

<template>
  <TransitionGroup
    tag="ul"
    role="list"
    :class="['fui-cart-item-detailed', props.class]"
    leave-active-class="transition-opacity duration-200 ease-out"
    leave-to-class="opacity-0"
    move-class="transition-transform duration-300 ease-out"
  >
    <li v-for="(line, index) in items" :key="line.id" class="flex flex-col gap-5">
      <Separator v-if="index > 0" />
      <div data-slot="cart-item-detailed-line" class="fui-cart-item-detailed-line flex">
        <div data-slot="cart-item-detailed-image" class="fui-cart-item-detailed-image shrink-0 overflow-hidden">
          <Image :src="line.image ?? '/placeholder.svg'" alt="" class="size-full object-cover" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 flex-col gap-1">
              <h3 data-slot="section-title" class="fui-section-title">{{ line.name }}</h3>
              <p v-if="line.variant" data-slot="meta" class="fui-meta">{{ line.variant }}</p>
              <p v-if="line.quantity > 1" data-slot="meta" class="fui-meta tabular-nums">{{ eachLabel(formatPrice(line.price, locale)) }}</p>
            </div>
            <Price size="sm" :price="lineTotal(line)" :locale="locale" :show-discount="false" align="end" class="shrink-0" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-1">
              <Button variant="outline" color="neutral" size="icon-sm" :aria-label="decreaseLabel(line.name)" :disabled="line.quantity <= 1" @click="setQuantity(line.id, line.quantity - 1)">
                <IconPlaceholder lucide="MinusIcon" tabler="IconMinus" hugeicons="MinusSignIcon" phosphor="MinusIcon" remixicon="RiSubtractLine" data-icon />
              </Button>
              <span data-slot="cart-item-detailed-quantity" class="fui-cart-item-detailed-quantity text-center tabular-nums" aria-live="polite">{{ line.quantity }}</span>
              <Button variant="outline" color="neutral" size="icon-sm" :aria-label="increaseLabel(line.name)" :disabled="line.quantity >= maxQuantity" @click="setQuantity(line.id, line.quantity + 1)">
                <IconPlaceholder lucide="PlusIcon" tabler="IconPlus" hugeicons="PlusSignIcon" phosphor="PlusIcon" remixicon="RiAddLine" data-icon />
              </Button>
            </div>
            <Button variant="ghost" color="neutral" size="icon-sm" data-slot="quiet-action" class="fui-quiet-action" :aria-label="removeLabel(line.name)" @click="remove(line.id)">
              <IconPlaceholder lucide="Trash2Icon" tabler="IconTrash" hugeicons="Delete02Icon" phosphor="TrashIcon" remixicon="RiDeleteBinLine" data-icon />
            </Button>
          </div>
        </div>
      </div>
    </li>
  </TransitionGroup>
</template>

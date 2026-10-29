<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { clampQuantity, lineTotal } from '@library/lib/cart'
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@library/components/ui/number-field'
import { Price } from '@library/components/ui/price'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** Highest quantity a shopper can set on one item. */
    maxQuantity?: number
    /** Builds the screen-reader name of an item's remove button from the item's name. */
    removeLabel?: (name: string) => string
    /** Builds the screen-reader name of an item's quantity field from the item's name. */
    quantityAriaLabel?: (name: string) => string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    maxQuantity: 10,
    removeLabel: (name: string) => `Remove ${name}`,
    quantityAriaLabel: (name: string) => `Quantity of ${name}`,
  },
)
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
    :class="['fui-cart-item-compact', props.class]"
    leave-active-class="transition-opacity duration-200 ease-out"
    leave-to-class="opacity-0"
    move-class="transition-transform duration-300 ease-out"
  >
    <li v-for="line in items" :key="line.id" class="flex gap-3">
      <div data-slot="cart-item-compact-image" class="fui-cart-item-compact-image shrink-0 overflow-hidden">
        <Image :src="line.image ?? '/placeholder.svg'" alt="" class="size-full object-cover" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 flex-col gap-0.5">
            <h3 data-slot="line-title" class="fui-line-title">{{ line.name }}</h3>
            <p v-if="line.variant" data-slot="meta" class="fui-meta">{{ line.variant }}</p>
          </div>
          <div class="-mt-1 -me-2 flex shrink-0">
            <Button variant="ghost" color="neutral" size="icon-sm" data-slot="quiet-action" class="fui-quiet-action" :aria-label="removeLabel(line.name)" @click="remove(line.id)">
              <IconPlaceholder lucide="Trash2Icon" tabler="IconTrash" hugeicons="Delete02Icon" phosphor="TrashIcon" remixicon="RiDeleteBinLine" data-icon />
            </Button>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <NumberField
            :model-value="line.quantity"
            :min="1"
            :max="maxQuantity"
            :aria-label="quantityAriaLabel(line.name)"
            class="w-28"
            @update:model-value="(quantity?: number) => quantity !== undefined && setQuantity(line.id, quantity)"
          >
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
          <Price size="sm" :price="lineTotal(line)" :locale="locale" :show-discount="false" align="end" class="ms-auto shrink-0" />
        </div>
      </div>
    </li>
  </TransitionGroup>
</template>

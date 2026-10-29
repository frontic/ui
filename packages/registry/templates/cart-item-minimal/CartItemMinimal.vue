<script lang="ts">
/** Lists the cart's items with image, variant, quantity and price, without editing. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CartLine } from './types'
import { lineTotal } from '@library/lib/cart'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'

const props = withDefaults(
  defineProps<{
    /** The cart's lines to list. */
    items?: CartLine[]
    /** Builds the quantity text next to the variant, e.g. `Qty 2`. */
    quantityLabel?: (quantity: number) => string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    items: () => [],
    quantityLabel: (quantity: number) => `Qty ${quantity}`,
  },
)
</script>

<template>
  <ul role="list" :class="['fui-cart-item-minimal', props.class]">
    <li v-for="line in items" :key="line.id" class="flex items-center gap-3">
      <div data-slot="cart-item-minimal-image" class="fui-cart-item-minimal-image shrink-0 overflow-hidden">
        <Image :src="line.image ?? '/placeholder.svg'" alt="" class="size-full object-cover" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 data-slot="line-title" class="fui-line-title truncate">{{ line.name }}</h3>
        <span data-slot="meta" class="fui-meta truncate">
          <template v-if="line.variant">{{ line.variant }} · </template>{{ quantityLabel(line.quantity) }}
        </span>
      </div>
      <Price size="sm" :price="lineTotal(line)" :locale="locale" :show-discount="false" align="end" class="shrink-0" />
    </li>
  </ul>
</template>

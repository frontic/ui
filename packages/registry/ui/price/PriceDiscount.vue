<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the percentage saved against the original price. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { PRICE_INJECTION_KEY } from '.'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const ctx = inject(PRICE_INJECTION_KEY)

defineSlots<{
  /** Replaces the discount badge; gets the percentage saved. */
  default?: (props: { percent: number }) => unknown
}>()
</script>

<template>
  <span v-if="ctx?.isDiscounted.value && ctx.discountPercent.value > 0" data-slot="price-discount" :class="['fui-price-discount', props.class]">
    <slot :percent="ctx.discountPercent.value">
      <Badge variant="discount"
        ><span data-slot="price-discount-amount" dir="ltr">-{{ ctx.discountPercent.value }}%</span></Badge
      >
    </slot>
  </span>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the current price of the product. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { PRICE_INJECTION_KEY } from '.'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const ctx = inject(PRICE_INJECTION_KEY)
</script>

<template>
  <span v-if="ctx" data-slot="price-amount" :class="props.class">
    <span v-if="ctx.isDiscounted.value" class="sr-only">{{ ` ${ctx.amountLabel.value} ` }}</span>
    <slot>{{ ctx.formattedPrice.value }}</slot>
  </span>
</template>

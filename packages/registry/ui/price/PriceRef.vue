<script lang="ts">
/** Shows the original price of a discounted product. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { cva } from 'class-variance-authority'
import { PRICE_INJECTION_KEY } from '.'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const ctx = inject(PRICE_INJECTION_KEY)

const strike = cva('fui-price-strike', {
  variants: {
    size: { sm: 'fui-price-strike-sm', md: 'fui-price-strike-md', lg: 'fui-price-strike-lg' },
  },
  defaultVariants: { size: 'md' },
})
</script>

<template>
  <span v-if="ctx?.isDiscounted.value" data-slot="price-ref" :class="[strike({ size: ctx.size.value }), props.class]">
    <span class="sr-only">{{ ` ${ctx.refLabel.value} ` }}</span>
    <slot>{{ ctx.formattedRef.value }}</slot>
  </span>
</template>

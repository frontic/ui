<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Marks an item with a short label such as new or sale. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'

const badge = cva('fui-badge group/badge overflow-hidden whitespace-nowrap outline-none transition-colors **:data-icon:pointer-events-none', {
  variants: {
    variant: {
      neutral: 'fui-badge-neutral',
      primary: 'fui-badge-primary',
      info: 'fui-badge-info',
      success: 'fui-badge-success',
      warning: 'fui-badge-warning',
      error: 'fui-badge-error',
      promo: 'fui-badge-promo',
      discount: 'fui-badge-discount',
      new: 'fui-badge-new',
      price: 'fui-badge-price',
    },
    size: {
      sm: 'fui-badge-sm',
      md: 'fui-badge-md',
      lg: 'fui-badge-lg',
    },
  },
  defaultVariants: { variant: 'neutral', size: 'md' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** What the badge marks: a state (info, success, warning, error), a commerce label (promo, discount, new, price), the brand colour (primary) or nothing in particular (neutral). Each takes its own colour and form. */
      variant?: VariantProps<typeof badge>['variant']
      /** The badge's padding and text size: sm keeps the smallest text, md and lg take the caption style. */
      size?: VariantProps<typeof badge>['size']
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'span', variant: 'neutral', size: 'md' },
)
</script>

<template>
  <Primitive data-slot="badge" :data-variant="props.variant" :as="props.as" :as-child="props.asChild" :class="[badge({ variant: props.variant, size: props.size }), props.class]">
    <slot />
  </Primitive>
</template>

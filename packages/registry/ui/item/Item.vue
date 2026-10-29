<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'

const item = cva('fui-item group/item transition-colors duration-100 outline-none', {
  variants: {
    variant: {
      default: 'fui-item-default',
      outline: 'fui-item-outline',
      muted: 'fui-item-muted',
    },
    size: {
      md: 'fui-item-md',
      sm: 'fui-item-sm',
      xs: 'fui-item-xs',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The visual style: no border, an outlined border or a muted background. */
      variant?: VariantProps<typeof item>['variant']
      /** The padding and gap around the item's content. */
      size?: VariantProps<typeof item>['size']
    }
  >(),
  {
    as: 'div',
    variant: 'default',
    size: 'md',
  },
)
</script>

<template>
  <Primitive
    data-slot="item"
    :data-variant="props.variant"
    :data-size="props.size"
    :as="props.as"
    :as-child="props.asChild"
    :class="[item({ variant: props.variant, size: props.size }), (props.as === 'a' || props.asChild) && 'fui-item-link', props.class]"
  >
    <slot />
  </Primitive>
</template>

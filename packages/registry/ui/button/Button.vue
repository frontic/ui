<script lang="ts">
/** Lets the user trigger an action, such as adding a product to the cart. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'

const button = cva(
  'fui-button group/button whitespace-nowrap bg-clip-padding outline-none transition-all select-none focus-visible:fui-focus-ring aria-invalid:fui-invalid disabled:pointer-events-none disabled:fui-disabled aria-disabled:pointer-events-none aria-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      variant: {
        solid: 'fui-button-solid',
        outline: 'fui-button-outline',
        soft: 'fui-button-soft',
        ghost: 'fui-button-ghost',
        link: 'fui-button-link',
      },
      color: {
        primary: 'fui-button-primary',
        neutral: 'fui-button-neutral',
        destructive: 'fui-button-destructive',
        buy: 'fui-button-buy',
        checkout: 'fui-button-checkout',
        inverse: 'fui-button-inverse',
      },
      size: {
        xs: 'fui-button-xs',
        sm: 'fui-button-sm',
        md: 'fui-button-md',
        lg: 'fui-button-lg',
        'icon-xs': 'fui-button-icon-xs',
        'icon-sm': 'fui-button-icon-sm',
        'icon-md': 'fui-button-icon-md',
        'icon-lg': 'fui-button-icon-lg',
      },
    },
    defaultVariants: { variant: 'solid', color: 'primary', size: 'md' },
  },
)

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** The visual style: a filled, outlined, tinted, background-free or text-link button. */
      variant?: VariantProps<typeof button>['variant']
      /** The colour role, e.g. primary for the brand colour, buy for add-to-cart, checkout for the checkout step, destructive for removing. */
      color?: VariantProps<typeof button>['color']
      /** The button's height and padding; the `icon-*` sizes make a square, icon-only button. */
      size?: VariantProps<typeof button>['size']
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'button', variant: 'solid', color: 'primary', size: 'md' },
)
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-size="props.size"
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' && !props.asChild ? 'button' : undefined"
    :class="[button({ variant: props.variant, color: props.color, size: props.size }), props.class]"
  >
    <slot />
  </Primitive>
</template>

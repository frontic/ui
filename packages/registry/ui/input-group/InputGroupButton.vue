<script lang="ts">
/** Lets the user act on the input of its group, such as submit it. */
export default {}
</script>

<script setup lang="ts">
import type { InputGroupButtonProps } from '.'
import { cva } from 'class-variance-authority'
import { Button } from '@library/components/ui/button'

const props = withDefaults(defineProps<InputGroupButtonProps>(), {
  size: 'xs',
  variant: 'ghost',
  color: 'neutral',
})

const button = cva('fui-input-group-button', {
  variants: {
    size: {
      xs: 'fui-input-group-button-xs',
      sm: 'fui-input-group-button-sm',
      'icon-xs': 'fui-input-group-button-icon-xs',
      'icon-sm': 'fui-input-group-button-icon-sm',
    },
  },
  defaultVariants: { size: 'xs' },
})
</script>

<template>
  <Button type="button" :size="null" :data-size="props.size" :variant="props.variant" :color="props.color" :class="[button({ size: props.size }), props.class]">
    <slot />
  </Button>
</template>

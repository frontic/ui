<script setup lang="ts">
import type { ToggleEmits, ToggleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva, type VariantProps } from 'class-variance-authority'
import { Toggle, useForwardPropsEmits } from 'reka-ui'

const toggle = cva(
  'fui-toggle group/toggle whitespace-nowrap outline-none transition-colors focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      variant: { default: 'fui-toggle-default', outline: 'fui-toggle-outline' },
      size: { md: 'fui-toggle-md', sm: 'fui-toggle-sm', lg: 'fui-toggle-lg', 'icon-sm': 'fui-toggle-icon-sm', 'icon-md': 'fui-toggle-icon-md', 'icon-lg': 'fui-toggle-icon-lg' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

const props = withDefaults(
  defineProps<
    ToggleProps & {
      class?: HTMLAttributes['class']
      /** The visual style: transparent or outlined. */
      variant?: VariantProps<typeof toggle>['variant']
      /** The height and padding of the toggle; the icon sizes make a square toggle that holds only an icon. */
      size?: VariantProps<typeof toggle>['size']
    }
  >(),
  {
    variant: 'default',
    size: 'md',
    disabled: false,
  },
)

const emits = defineEmits<ToggleEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

type DataState = 'on' | 'off'

defineSlots<{
  /** Holds the toggle's label or icon; gets whether it is pressed or disabled and its state as `on` or `off`. */
  default?: (props: { modelValue: boolean; state: DataState; pressed: boolean; disabled: boolean }) => unknown
}>()
</script>

<template>
  <Toggle v-slot="slotProps" data-slot="toggle" v-bind="forwarded" :class="[toggle({ variant, size }), props.class]">
    <slot v-bind="slotProps" />
  </Toggle>
</template>

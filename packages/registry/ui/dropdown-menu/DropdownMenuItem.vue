<script lang="ts">
/** Holds one action the user can pick from the dropdown menu. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuItem, useForwardProps } from 'reka-ui'

const props = withDefaults(
  defineProps<
    DropdownMenuItemProps & {
      class?: HTMLAttributes['class']
      /** Indents the item to line up with items that show a check or icon. */
      inset?: boolean
      /** The item's intent: destructive marks an action that deletes or cannot be undone, such as removing an address. */
      color?: 'neutral' | 'destructive'
    }
  >(),
  {
    color: 'neutral',
  },
)

const delegatedProps = reactiveOmit(props, 'inset', 'color', 'class')

const forwardedProps = useForwardProps(delegatedProps)

const item = cva(
  'fui-dropdown-menu-item group/dropdown-menu-item relative cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      color: { destructive: 'fui-dropdown-menu-item-destructive' },
      pad: { default: 'fui-dropdown-menu-item-default', inset: 'fui-dropdown-menu-item-inset', indicator: 'fui-dropdown-menu-item-indicator' },
    },
    defaultVariants: { pad: 'default' },
  },
)
</script>

<template>
  <DropdownMenuItem
    data-slot="dropdown-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-color="color"
    v-bind="forwardedProps"
    :class="[item({ color: props.color === 'destructive' ? 'destructive' : undefined, pad: props.inset ? 'inset' : 'default' }), props.class]"
  >
    <slot />
  </DropdownMenuItem>
</template>

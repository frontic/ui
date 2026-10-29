<script lang="ts">
/** Lets the user open a nested sidebar menu item. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'

const sidebarMenuSubButton = cva(
  'fui-sidebar-menu-sub-button -translate-x-px overflow-hidden outline-none group-data-collapsible-icon:hidden focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled aria-disabled:pointer-events-none aria-disabled:fui-disabled [&>span:last-child]:truncate *:data-icon:shrink-0',
  {
    variants: {
      size: {
        sm: 'fui-sidebar-menu-sub-button-sm',
        md: 'fui-sidebar-menu-sub-button-md',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** The text size of the sub-item. */
      size?: 'sm' | 'md'
      /** Highlights the sub-item as the current page. */
      isActive?: boolean
      class?: HTMLAttributes['class']
    }
  >(),
  {
    as: 'a',
    size: 'md',
  },
)
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-sub-button"
    data-sidebar="menu-sub-button"
    :as="as"
    :as-child="asChild"
    :data-size="size"
    :data-active="isActive || undefined"
    :class="[sidebarMenuSubButton({ size }), props.class]"
  >
    <slot />
  </Primitive>
</template>

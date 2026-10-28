<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { injectSidebarInstance, useSidebar } from './utils'

export type SidebarMenuButtonVariant = 'default' | 'outline'
export type SidebarMenuButtonSize = 'md' | 'sm' | 'lg'

export interface SidebarMenuButtonProps extends PrimitiveProps {
  /** The visual style: transparent, or outlined on the background colour. */
  variant?: SidebarMenuButtonVariant
  /** The height and text size of the button. */
  size?: SidebarMenuButtonSize
  /** Highlights the button as the current page. */
  isActive?: boolean
  class?: HTMLAttributes['class']
}

const sidebarMenuButton = cva(
  'fui-sidebar-menu-button peer/menu-button group/menu-button overflow-hidden outline-none transition-all focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled aria-disabled:pointer-events-none aria-disabled:fui-disabled [&>span:last-child]:truncate *:data-icon:shrink-0 not-in-data-collapsible-icon:group-has-[[data-sidebar=menu-action]]/menu-item:pe-8',
  {
    variants: {
      variant: {
        default: 'fui-sidebar-menu-button-default',
        outline: 'fui-sidebar-menu-button-outline',
      },
      size: {
        md: 'fui-sidebar-menu-button-md',
        sm: 'fui-sidebar-menu-button-sm',
        lg: 'fui-sidebar-menu-button-lg',
      },
      mode: {
        expanded: 'fui-sidebar-menu-button-expanded',
        collapsed: 'fui-sidebar-menu-button-collapsed',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      mode: 'expanded',
    },
  },
)

const props = withDefaults(defineProps<SidebarMenuButtonProps>(), {
  as: 'button',
  variant: 'default',
  size: 'md',
})

const { isMobile, state } = useSidebar()
const sidebar = injectSidebarInstance(null)
const iconOnly = computed(() => !isMobile.value && state.value === 'collapsed' && sidebar?.collapsible.value === 'icon')
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
    :data-size="size"
    :data-size-md="size === 'md' ? '' : undefined"
    :data-size-sm="size === 'sm' ? '' : undefined"
    :data-size-lg="size === 'lg' ? '' : undefined"
    :data-active="isActive || undefined"
    :class="[sidebarMenuButton({ variant, size, mode: iconOnly ? 'collapsed' : 'expanded' }), props.class]"
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>

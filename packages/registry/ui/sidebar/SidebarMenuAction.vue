<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Adds a secondary action button to a sidebar menu item. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { useSidebar } from './utils'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** Hides the action until its menu item is hovered or focused; always shown on mobile. */
      showOnHover?: boolean
      class?: HTMLAttributes['class']
    }
  >(),
  {
    as: 'button',
  },
)

const { isMobile } = useSidebar()
const hidden = computed(() => props.showOnHover && !isMobile.value)
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-action"
    data-sidebar="menu-action"
    :class="[
      'fui-sidebar-action absolute top-1.5 inset-e-1 aspect-square outline-none transition-transform after:absolute after:-inset-2 peer-data-size-md/menu-button:top-2 peer-data-size-sm/menu-button:top-1 peer-data-size-lg/menu-button:top-2.5 group-data-collapsible-icon:hidden focus-visible:fui-focus-ring *:data-icon:shrink-0',
      hidden && 'opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 aria-expanded:opacity-100',
      props.class,
    ]"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>

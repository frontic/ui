<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user toggle the sidebar by clicking along its edge. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { injectSidebarInstance, useSidebar } from './utils'

const props = withDefaults(
  defineProps<{
    /** Read by screen readers and shown as the tooltip on the rail that toggles the sidebar. */
    label?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    label: 'Toggle Sidebar',
  },
)

const { state, toggleSidebar } = useSidebar()
const { collapsible, side } = injectSidebarInstance()
const offcanvas = computed(() => state.value === 'collapsed' && collapsible.value === 'offcanvas')
const collapsed = computed(() => state.value === 'collapsed')

const sidebarRail = cva('fui-sidebar-rail group/rail absolute inset-y-0 z-20 transition-all ease-linear', {
  variants: {
    mode: {
      default: 'fui-sidebar-rail-default',
      offcanvas: 'fui-sidebar-rail-offcanvas',
    },
  },
  defaultVariants: { mode: 'default' },
})
</script>

<template>
  <button
    data-sidebar="rail"
    data-slot="sidebar-rail"
    :aria-label="props.label"
    :tabindex="-1"
    :title="props.label"
    :class="[
      sidebarRail({ mode: offcanvas ? 'offcanvas' : 'default' }),
      (side === 'start') === collapsed ? 'cursor-e-resize rtl:cursor-w-resize' : 'cursor-w-resize rtl:cursor-e-resize',
      offcanvas ? (side === 'start' ? '-inset-e-2' : '-inset-s-2') : side === 'start' ? '-inset-e-4 -translate-x-1/2 rtl:translate-x-1/2' : 'inset-s-0 -translate-x-1/2 rtl:translate-x-1/2',
      props.class,
    ]"
    @click="toggleSidebar"
  >
    <span aria-hidden="true" :class="['absolute inset-y-0 opacity-0 group-hover/rail:opacity-100', offcanvas ? 'inset-s-full' : 'inset-s-1/2']">
      <span data-slot="sidebar-rail-line" class="fui-sidebar-rail-line block h-full" />
    </span>
    <slot />
  </button>
</template>

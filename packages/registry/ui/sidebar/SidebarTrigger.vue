<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user expand and collapse the sidebar. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@library/components/ui/button'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { useSidebar } from './utils'

const props = withDefaults(
  defineProps<{
    /** Read by screen readers on the button that toggles the sidebar. */
    label?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    label: 'Toggle Sidebar',
  },
)

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button data-sidebar="trigger" data-slot="sidebar-trigger" variant="ghost" color="neutral" size="icon-sm" :class="props.class" @click="toggleSidebar">
    <IconPlaceholder lucide="PanelLeftIcon" tabler="IconLayoutSidebar" hugeicons="LayoutLeftIcon" phosphor="SidebarSimpleIcon" remixicon="RiSideBarLine" class="rtl:-scale-x-100" data-icon />
    <span class="sr-only">{{ props.label }}</span>
  </Button>
</template>

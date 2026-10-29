<script setup lang="ts">
import type { SidebarProps } from '.'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@library/components/ui/sheet'
import { cva } from 'class-variance-authority'
import { useDirection } from 'reka-ui'
import { computed, toRef } from 'vue'
import { physicalSide, provideSidebarInstance, sidebarLayout, useSidebar } from './utils'

const sidebar = cva('fui-sidebar', {
  variants: {
    variant: {
      sidebar: 'fui-sidebar-sidebar',
      inset: 'fui-sidebar-variant-inset',
      floating: 'fui-sidebar-floating',
    },
  },
  defaultVariants: { variant: 'sidebar' },
})

const sidebarSize = cva('fui-sidebar-size relative transition-all duration-200 ease-linear', {
  variants: {
    width: {
      icon: 'fui-sidebar-size-icon',
      'icon-padded': 'fui-sidebar-size-icon-padded',
      offcanvas: 'fui-sidebar-size-offcanvas',
      mobile: 'fui-sidebar-size-mobile',
    },
  },
})

const sidebarContainer = cva('fui-sidebar-container fixed inset-y-0 z-10 transition-all duration-200 ease-linear', {
  variants: {
    edge: {
      start: 'fui-sidebar-container-start',
      end: 'fui-sidebar-container-end',
      padded: 'fui-sidebar-container-padded',
    },
    width: {
      icon: 'fui-sidebar-container-icon',
      'icon-padded': 'fui-sidebar-container-icon-padded',
    },
  },
  defaultVariants: { edge: 'start' },
})

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SidebarProps>(), {
  side: 'start',
  collapsible: 'offcanvas',
  label: 'Sidebar',
  description: 'Displays the mobile sidebar.',
})

const { isMobile, state, openMobile, setOpenMobile, variant: layoutVariant } = useSidebar()
const dir = useDirection()

const variant = computed(() => props.variant ?? (layoutVariant.value === 'inset' ? 'inset' : 'sidebar'))
const dev = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV
if (dev && props.variant === 'inset' && layoutVariant.value !== 'inset')
  console.warn('<Sidebar variant="inset"> needs <SidebarProvider variant="inset">, which paints the wrapper and raises SidebarInset.')
provideSidebarInstance({ side: toRef(props, 'side'), collapsible: toRef(props, 'collapsible') })

const layout = computed(() => sidebarLayout(props.side, variant.value, props.collapsible, state.value === 'collapsed'))
</script>

<template>
  <div v-if="collapsible === 'none'" data-slot="sidebar" :class="[sidebar(), 'fui-sidebar-size', props.class]" v-bind="$attrs">
    <slot />
  </div>

  <Sheet v-else-if="isMobile" :open="openMobile" v-bind="$attrs" @update:open="setOpenMobile">
    <SheetContent data-sidebar="sidebar" data-slot="sidebar" data-mobile="true" :side="physicalSide(side, dir)" :show-close-button="false" class="fui-sidebar-size fui-sidebar-size-mobile">
      <SheetHeader class="sr-only">
        <SheetTitle>{{ props.label }}</SheetTitle>
        <SheetDescription>{{ props.description }}</SheetDescription>
      </SheetHeader>
      <div :class="[sidebar(), 'h-full w-full']">
        <slot />
      </div>
    </SheetContent>
  </Sheet>

  <div
    v-else
    class="group peer block"
    data-slot="sidebar"
    :data-state="state"
    :data-collapsible="layout.collapsedTo ?? ''"
    :data-collapsed="state === 'collapsed' ? '' : undefined"
    :data-collapsible-icon="layout.collapsedTo === 'icon' ? '' : undefined"
    :data-collapsible-offcanvas="layout.collapsedTo === 'offcanvas' ? '' : undefined"
    :data-variant="variant"
    :data-side="side"
  >
    <div data-slot="sidebar-gap" :class="[sidebarSize({ width: layout.gap }), side === 'end' && 'rotate-180']" />
    <div data-slot="sidebar-container" :data-side="side" :class="['fui-sidebar-size', sidebarContainer({ edge: layout.edge, width: layout.container }), layout.offset, props.class]" v-bind="$attrs">
      <div data-sidebar="sidebar" data-slot="sidebar-inner" :class="[sidebar({ variant }), 'size-full']">
        <slot />
      </div>
    </div>
  </div>
</template>

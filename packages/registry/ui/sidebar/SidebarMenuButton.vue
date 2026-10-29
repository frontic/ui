<script lang="ts">
/** Lets the user open a sidebar menu item, with a tooltip when collapsed. */
export default {}
</script>

<script setup lang="ts">
import type { Component } from 'vue'
import type { SidebarMenuButtonProps } from './SidebarMenuButtonChild.vue'
import { reactiveOmit } from '@vueuse/core'
import { useDirection } from 'reka-ui'
import { Tooltip, TooltipContent, TooltipTrigger } from '@library/components/ui/tooltip'
import SidebarMenuButtonChild from './SidebarMenuButtonChild.vue'
import { injectSidebarInstance, physicalSide, useSidebar } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    SidebarMenuButtonProps & {
      /** Shown in a tooltip beside the button while the sidebar is collapsed to icons; text or a component. */
      tooltip?: string | Component
    }
  >(),
  {
    as: 'button',
    variant: 'default',
    size: 'md',
  },
)

const { isMobile, state } = useSidebar()
const sidebar = injectSidebarInstance(null)
const dir = useDirection()

const delegatedProps = reactiveOmit(props, 'tooltip')
</script>

<template>
  <SidebarMenuButtonChild v-if="!tooltip" v-bind="{ ...delegatedProps, ...$attrs }">
    <slot />
  </SidebarMenuButtonChild>

  <Tooltip v-else>
    <TooltipTrigger as-child>
      <SidebarMenuButtonChild v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
      </SidebarMenuButtonChild>
    </TooltipTrigger>
    <TooltipContent :side="physicalSide(sidebar?.side.value === 'end' ? 'start' : 'end', dir)" align="center" :hidden="state !== 'collapsed' || isMobile">
      <template v-if="typeof tooltip === 'string'">
        {{ tooltip }}
      </template>
      <component :is="tooltip" v-else />
    </TooltipContent>
  </Tooltip>
</template>

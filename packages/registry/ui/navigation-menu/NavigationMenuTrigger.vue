<script lang="ts">
/** Opens and closes the content of its navigation menu item. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<NavigationMenuTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuTrigger
    data-slot="navigation-menu-trigger"
    v-bind="forwardedProps"
    :class="['fui-navigation-menu-trigger group/navigation-menu-trigger outline-none transition-all focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled', props.class]"
  >
    <slot />
    <IconPlaceholder
      lucide="ChevronDownIcon"
      tabler="IconChevronDown"
      hugeicons="ArrowDown01Icon"
      phosphor="CaretDownIcon"
      remixicon="RiArrowDownSLine"
      data-icon
      class="relative top-px ms-1 transition duration-300 group-aria-expanded/navigation-menu-trigger:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuTrigger>
</template>

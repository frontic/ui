<script lang="ts">
/** Points to the trigger of the currently open navigation menu item. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuIndicatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuIndicator, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuIndicator
    data-slot="navigation-menu-indicator"
    v-bind="forwardedProps"
    :style="{ width: 'var(--reka-navigation-menu-indicator-size)' }"
    :class="[
      'fui-navigation-menu-indicator absolute top-full left-0 z-1 translate-x-(--reka-navigation-menu-indicator-position) transition-transform data-state-visible:animate-in data-state-hidden:animate-out data-state-visible:fade-in data-state-hidden:fade-out overflow-hidden',
      props.class,
    ]"
  >
    <div class="fui-navigation-menu-indicator-arrow relative top-3/5 rotate-45" />
  </NavigationMenuIndicator>
</template>

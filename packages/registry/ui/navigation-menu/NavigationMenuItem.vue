<script lang="ts">
/** Groups a trigger with the content it opens, or holds a single link. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { injectNavigationMenuContext, NavigationMenuItem, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
const menu = injectNavigationMenuContext()
</script>

<template>
  <!-- Positioned only for a panel of its own: the indicator reads the trigger's offset from the list. -->
  <NavigationMenuItem data-slot="navigation-menu-item" v-bind="forwarded" :class="[{ relative: !menu.viewport.value }, props.class]">
    <slot />
  </NavigationMenuItem>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the content of the open mega menu item. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuViewport, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuViewport
    data-slot="mega-menu-viewport"
    v-bind="forwardedProps"
    :class="[
      'fui-mega-menu-viewport absolute inset-x-0 top-full z-50 origin-top overflow-hidden transition-all duration-200 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-98 data-closed:zoom-out-98',
      props.class,
    ]"
  />
</template>

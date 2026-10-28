<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups a trigger with the content it opens in the mega menu. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuItem, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuItem data-slot="mega-menu-item" v-bind="forwarded" :class="['fui-mega-menu-item static', props.class]">
    <slot />
  </NavigationMenuItem>
</template>

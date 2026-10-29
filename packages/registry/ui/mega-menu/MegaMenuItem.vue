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

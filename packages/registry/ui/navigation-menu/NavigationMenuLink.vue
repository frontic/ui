<script setup lang="ts">
import type { NavigationMenuLinkEmits, NavigationMenuLinkProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { NavigationMenuLink, useForwardPropsEmits } from 'reka-ui'
import { inject } from 'vue'
import { NAVIGATION_MENU_PANEL } from './context'

const props = defineProps<NavigationMenuLinkProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<NavigationMenuLinkEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
// A link in the bar sits beside the triggers and takes their size.
const place = inject(NAVIGATION_MENU_PANEL, undefined) ? 'panel' : 'bar'
const link = cva('fui-navigation-menu-link outline-none transition-all focus-visible:fui-focus-ring **:data-icon:shrink-0', {
  variants: { place: { panel: 'fui-navigation-menu-link-panel', bar: 'fui-navigation-menu-link-bar' } },
  defaultVariants: { place: 'panel' },
})
</script>

<template>
  <NavigationMenuLink data-slot="navigation-menu-link" v-bind="forwarded" :class="[link({ place }), props.class]">
    <slot />
  </NavigationMenuLink>
</template>

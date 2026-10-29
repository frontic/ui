<script setup lang="ts">
import type { NavigationMenuContentEmits, NavigationMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectNavigationMenuContext, NavigationMenuContent, useForwardPropsEmits } from 'reka-ui'
import { provide } from 'vue'
import { NAVIGATION_MENU_PANEL } from './context'

const props = defineProps<NavigationMenuContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<NavigationMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const menu = injectNavigationMenuContext()
provide(NAVIGATION_MENU_PANEL, true)
// Without a viewport the content draws its own surface.
const content = cva(
  'fui-navigation-menu-content absolute inset-s-0 data-motion-from:animate-in data-motion-to:animate-out data-motion-from:fade-in data-motion-to:fade-out data-motion-from-end:slide-in-from-end-52 data-motion-from-start:slide-in-from-start-52 data-motion-to-end:slide-out-to-end-52 data-motion-to-start:slide-out-to-start-52',
  {
    variants: { surface: { shared: 'fui-navigation-menu-content-shared', own: 'fui-navigation-menu-content-own' } },
    defaultVariants: { surface: 'shared' },
  },
)
</script>

<template>
  <NavigationMenuContent
    data-slot="navigation-menu-content"
    v-bind="forwarded"
    :class="[
      content({ surface: menu.viewport.value ? 'shared' : 'own' }),
      menu.viewport.value
        ? 'top-0'
        : 'top-full data-open:animate-in data-closed:animate-out data-open:zoom-in-95 data-closed:zoom-out-95 data-open:fade-in-0 data-closed:fade-out-0 duration-300 overflow-hidden',
      props.class,
    ]"
  >
    <slot />
  </NavigationMenuContent>
</template>

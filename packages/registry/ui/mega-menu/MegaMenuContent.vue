<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Holds the links and content shown when its menu item is open. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuContentEmits, NavigationMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuContent, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<
  NavigationMenuContentProps & {
    class?: HTMLAttributes['class']
  }
>()
const emits = defineEmits<NavigationMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NavigationMenuContent
    data-slot="mega-menu-content"
    v-bind="forwarded"
    :class="[
      'fui-mega-menu-content absolute inset-x-0 top-0 data-motion-from:animate-in data-motion-to:animate-out data-motion-from:fade-in data-motion-to:fade-out data-motion-from-end:slide-in-from-end-8 data-motion-from-start:slide-in-from-start-8 data-motion-to-end:slide-out-to-end-8 data-motion-to-start:slide-out-to-start-8',
      props.class,
    ]"
  >
    <slot />
  </NavigationMenuContent>
</template>

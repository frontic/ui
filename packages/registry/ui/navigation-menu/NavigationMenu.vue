<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the navigation menu. */
export default {}
</script>

<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuRoot, useForwardPropsEmits } from 'reka-ui'
import NavigationMenuViewport from './NavigationMenuViewport.vue'

const props = withDefaults(
  defineProps<
    NavigationMenuRootProps & {
      class?: HTMLAttributes['class']
      /** Shows open menu content in one shared panel below the bar; turn off to show each panel under its own trigger. */
      viewport?: boolean
    }
  >(),
  {
    viewport: true,
  },
)
const emits = defineEmits<NavigationMenuRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'viewport')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the menu's list of items; gets the value of the open item as `modelValue`. */
  default?: (props: { modelValue: string }) => unknown
}>()
</script>

<template>
  <NavigationMenuRoot v-slot="slotProps" data-slot="navigation-menu" :data-viewport="viewport" v-bind="forwarded" :class="['fui-navigation-menu group/navigation-menu relative', props.class]">
    <slot v-bind="slotProps" />
    <NavigationMenuViewport v-if="viewport" />
  </NavigationMenuRoot>
</template>

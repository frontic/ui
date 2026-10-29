<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<
  NavigationMenuRootProps & {
    class?: HTMLAttributes['class']
  }
>()
const emits = defineEmits<NavigationMenuRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the mega menu's items; gets the value of the open item as `modelValue`. */
  default?: (props: { modelValue: string }) => unknown
}>()
</script>

<template>
  <NavigationMenuRoot v-slot="slotProps" data-slot="mega-menu" v-bind="forwarded" :class="['fui-mega-menu relative', props.class]">
    <slot v-bind="slotProps" />
  </NavigationMenuRoot>
</template>

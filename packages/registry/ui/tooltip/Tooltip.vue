<script setup lang="ts">
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'
import { TooltipRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<TooltipRootProps>()
const emits = defineEmits<TooltipRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

defineSlots<{
  /** Holds the trigger and the tooltip content; gets whether the tooltip is open. */
  default?: (props: { open: boolean }) => unknown
}>()
</script>

<template>
  <TooltipRoot v-slot="slotProps" data-slot="tooltip" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </TooltipRoot>
</template>

<script lang="ts">
/** Groups all parts of the popover. */
export default {}
</script>

<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'reka-ui'
import { PopoverRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<PopoverRootProps>()
const emits = defineEmits<PopoverRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

defineSlots<{
  /** Holds the popover's trigger and content; gets whether it is open and a function that closes it. */
  default?: (props: { open: boolean; close: () => void }) => unknown
}>()
</script>

<template>
  <PopoverRoot v-slot="slotProps" data-slot="popover" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </PopoverRoot>
</template>

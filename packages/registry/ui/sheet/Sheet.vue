<script lang="ts">
/** Groups all parts of the sheet, a panel that slides in from an edge. */
export default {}
</script>

<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { DialogRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

defineSlots<{
  /** Holds the sheet's trigger and content; gets whether it is open and a function that closes it. */
  default?: (props: { open: boolean; close: () => void }) => unknown
}>()
</script>

<template>
  <DialogRoot v-slot="slotProps" data-slot="sheet" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>

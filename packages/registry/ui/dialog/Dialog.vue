<script lang="ts">
/** Groups all parts of the dialog. */
export default {}
</script>

<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { DialogRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

defineSlots<{
  /** Holds the dialog's trigger and content; gets whether it is open and a function that closes it. */
  default?: (props: { open: boolean; close: () => void }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot v-slot="slotProps" data-slot="dialog" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>

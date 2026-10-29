<script setup lang="ts">
import type { AlertDialogEmits, AlertDialogProps } from 'reka-ui'
import { AlertDialogRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<AlertDialogProps>()
const emits = defineEmits<AlertDialogEmits>()

defineSlots<{
  /** Holds the alert dialog's trigger and content; gets whether it is open and a function that closes it. */
  default?: (props: { open: boolean; close: () => void }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <AlertDialogRoot v-slot="slotProps" data-slot="alert-dialog" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </AlertDialogRoot>
</template>

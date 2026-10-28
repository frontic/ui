<script lang="ts">
/** Holds the actions of the dialog, such as confirm and cancel buttons. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogClose } from 'reka-ui'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Adds an outlined button at the end of the footer that closes the dialog. */
    showCloseButton?: boolean
    /** Shown on the footer's close button. */
    closeLabel?: string
  }>(),
  {
    showCloseButton: false,
    closeLabel: 'Close',
  },
)
</script>

<template>
  <div data-slot="dialog-footer" :class="['fui-dialog-footer', props.class]">
    <slot />
    <DialogClose v-if="showCloseButton" as-child>
      <Button variant="outline" color="neutral">{{ closeLabel }}</Button>
    </DialogClose>
  </div>
</template>

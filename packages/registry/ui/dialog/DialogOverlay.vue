<script setup lang="ts">
import type { DialogOverlayProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogOverlay, useForwardProps } from 'reka-ui'

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DialogOverlay
    data-slot="dialog-overlay"
    v-bind="forwarded"
    :class="[
      'fui-dialog-overlay data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 duration-100 fixed inset-0 isolate z-50 supports-backdrop-filter:backdrop-blur-sm',
      props.class,
    ]"
  >
    <slot />
  </DialogOverlay>
</template>

<script lang="ts">
/** Explains what the action in the dialog will do. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogDescription, useForwardProps } from 'reka-ui'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AlertDialogDescription data-slot="alert-dialog-description" v-bind="forwarded" :class="['fui-alert-dialog-description text-balance @md:text-pretty', props.class]">
    <slot />
  </AlertDialogDescription>
</template>

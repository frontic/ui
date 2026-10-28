<script lang="ts">
/** Names the action the dialog asks the user to confirm. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogTitle, useForwardProps } from 'reka-ui'

const props = defineProps<AlertDialogTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AlertDialogTitle
    data-slot="alert-dialog-title"
    v-bind="forwarded"
    :class="['fui-alert-dialog-title @sm:group-has-[[data-slot=alert-dialog-media]]/alert-dialog-content:col-start-2 group-data-size-sm/alert-dialog-content:col-auto', props.class]"
  >
    <slot />
  </AlertDialogTitle>
</template>

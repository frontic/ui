<script lang="ts">
/** Lets the user jump to its step. */
export default {}
</script>

<script setup lang="ts">
import type { StepperTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { StepperTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<StepperTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperTrigger
    data-slot="stepper-trigger"
    v-bind="forwarded"
    :class="[
      'fui-stepper-trigger outline-none focus-visible:fui-focus-ring group-data-vertical/stepper:grid group-data-vertical/stepper:auto-cols-min group-data-vertical/stepper:grid-cols-1 group-data-vertical/stepper:items-start group-data-vertical/stepper:text-start',
      props.class,
    ]"
  >
    <slot />
  </StepperTrigger>
</template>

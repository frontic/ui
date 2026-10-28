<script lang="ts">
/** Explains in a short line what happens in a step. */
export default {}
</script>

<script setup lang="ts">
import type { StepperDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { StepperDescription, useForwardProps } from 'reka-ui'

const props = defineProps<StepperDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperDescription
    v-slot="slotProps"
    data-slot="stepper-description"
    v-bind="forwarded"
    :class="[
      'fui-stepper-description group-data-horizontal/stepper:@max-md:sr-only group-data-vertical/stepper:col-start-1 group-data-vertical/stepper:row-start-2 group-data-vertical/stepper:translate-y-0.5',
      props.class,
    ]"
  >
    <slot v-bind="slotProps" />
  </StepperDescription>
</template>

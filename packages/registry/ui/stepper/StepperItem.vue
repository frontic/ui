<script lang="ts">
/** Groups the trigger, title and description of one step in the stepper. */
export default {}
</script>

<script setup lang="ts">
import type { StepperItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { StepperItem, useForwardProps } from 'reka-ui'

const props = defineProps<StepperItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)

type StepperState = 'completed' | 'active' | 'inactive'

defineSlots<{
  /** Holds the step's trigger, title and description; gets whether the step is inactive, active or completed. */
  default?: (props: { state: StepperState }) => unknown
}>()
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    data-slot="stepper-item"
    v-bind="forwarded"
    :class="[
      'fui-stepper-item group data-disabled:pointer-events-none group-data-horizontal/stepper:@md:items-start group-data-horizontal/stepper:has-[[data-slot=stepper-separator]]:flex-1 group-data-horizontal/stepper:@md:relative group-data-horizontal/stepper:@md:flex-1 group-data-horizontal/stepper:@md:justify-center group-data-vertical/stepper:relative group-data-vertical/stepper:flex-col group-data-vertical/stepper:items-stretch group-data-vertical/stepper:has-[[data-slot=stepper-separator]]:pb-3',
      props.class,
    ]"
  >
    <slot v-bind="slotProps" />
  </StepperItem>
</template>

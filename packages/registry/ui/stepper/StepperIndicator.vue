<script lang="ts">
/** Marks the number or progress state of a step. */
export default {}
</script>

<script setup lang="ts">
import type { StepperIndicatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectStepperItemContext, StepperIndicator, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const stepperIndicator = cva('fui-stepper-indicator', {
  variants: {
    state: {
      inactive: 'fui-stepper-indicator-inactive',
      active: 'fui-stepper-indicator-active',
      completed: 'fui-stepper-indicator-completed',
    },
  },
  defaultVariants: { state: 'inactive' },
})

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
const item = injectStepperItemContext()
const state = computed(() => item.state.value)

defineSlots<{
  /** Holds what the indicator shows, such as the step number or an icon; gets the step's number. */
  default?: (props: { step: number }) => unknown
}>()
</script>

<template>
  <StepperIndicator
    v-slot="slotProps"
    data-slot="stepper-indicator"
    v-bind="forwarded"
    :class="[stepperIndicator({ state }), 'relative z-10 group-data-vertical/stepper:col-end-1 group-data-vertical/stepper:row-span-2 group-data-vertical/stepper:row-start-1', props.class]"
  >
    <slot v-bind="slotProps" />
  </StepperIndicator>
</template>

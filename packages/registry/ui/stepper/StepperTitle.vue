<script lang="ts">
/** Names a step of the stepper. */
export default {}
</script>

<script setup lang="ts">
import type { StepperTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectStepperItemContext, StepperTitle, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const stepperTitle = cva('fui-stepper-title whitespace-nowrap', {
  variants: {
    state: {
      inactive: 'fui-stepper-title-inactive',
      active: 'fui-stepper-title-active',
      completed: 'fui-stepper-title-completed',
    },
  },
  defaultVariants: { state: 'inactive' },
})

const props = defineProps<StepperTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
const item = injectStepperItemContext()
const state = computed(() => item.state.value)
const current = computed(() => state.value === 'active')
</script>

<template>
  <StepperTitle
    data-slot="stepper-title"
    :data-current="current ? '' : undefined"
    v-bind="forwarded"
    :class="[
      stepperTitle({ state }),
      'group-data-horizontal/stepper:@max-md:not-data-current:sr-only group-data-horizontal/stepper:@max-md:data-current:absolute group-data-horizontal/stepper:@max-md:data-current:inset-s-0 group-data-horizontal/stepper:@max-md:data-current:bottom-0 group-data-vertical/stepper:col-start-1 group-data-vertical/stepper:row-start-1 group-data-vertical/stepper:translate-y-1.5',
      props.class,
    ]"
  >
    <slot />
  </StepperTitle>
</template>

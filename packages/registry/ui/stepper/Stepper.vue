<script setup lang="ts">
import type { StepperRootEmits, StepperRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { StepperRoot, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<
    StepperRootProps & {
      class?: HTMLAttributes['class']
      /** Says where the user is when the row is too narrow to name every step. */
      statusLabel?: (step: number, total: number) => string
    }
  >(),
  { statusLabel: (step: number, total: number) => `Step ${step} of ${total}` },
)
const emits = defineEmits<StepperRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'statusLabel')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the steps; gets the current step, the number of steps, where the user is in the sequence and functions that move between steps. */
  default?: (props: {
    modelValue: number | undefined
    totalSteps: number
    isNextDisabled: boolean
    isPrevDisabled: boolean
    isFirstStep: boolean
    isLastStep: boolean
    goToStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    hasNext: () => boolean
    hasPrev: () => boolean
  }) => unknown
}>()
const vertical = computed(() => props.orientation === 'vertical')
</script>

<template>
  <StepperRoot
    v-slot="slotProps"
    data-slot="stepper"
    :data-horizontal="vertical ? undefined : ''"
    :data-vertical="vertical ? '' : undefined"
    :class="['fui-stepper group/stepper @container relative gap-y-3 data-vertical:flex-col data-vertical:flex-nowrap data-vertical:gap-y-0', props.class]"
    v-bind="forwarded"
  >
    <span v-if="!vertical && slotProps.modelValue !== undefined" data-slot="stepper-status" aria-hidden="true" class="fui-stepper-status order-last basis-full text-end @md:hidden">
      {{ props.statusLabel(slotProps.modelValue, slotProps.totalSteps) }}
    </span>
    <slot v-bind="slotProps" />
  </StepperRoot>
</template>

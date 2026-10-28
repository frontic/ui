<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Joins one step of the stepper to the next with a line that fills once the step is done. */
export default {}
</script>

<script setup lang="ts">
import type { StepperSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { injectStepperItemContext, StepperSeparator, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<StepperSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
const item = injectStepperItemContext()
const filled = computed(() => item.state.value === 'completed')
</script>

<template>
  <StepperSeparator
    data-slot="stepper-separator"
    v-bind="forwarded"
    :class="[
      'fui-stepper-separator-root relative group-data-horizontal/stepper:@md:absolute group-data-horizontal/stepper:@md:inset-s-1/2 group-data-horizontal/stepper:@md:top-5 group-data-horizontal/stepper:@md:mx-0 group-data-horizontal/stepper:@md:w-full group-data-vertical/stepper:absolute group-data-vertical/stepper:inset-s-5 group-data-vertical/stepper:top-5 group-data-vertical/stepper:mx-0 group-data-vertical/stepper:h-full group-data-vertical/stepper:w-px',
      props.class,
    ]"
  >
    <span data-slot="stepper-separator-track" class="fui-stepper-separator absolute inset-0">
      <span
        data-slot="stepper-separator-fill"
        :data-filled="filled ? '' : undefined"
        class="fui-stepper-separator-fill absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-out motion-reduce:transition-none data-filled:scale-x-100 group-data-horizontal/stepper:rtl:origin-right group-data-vertical/stepper:origin-top group-data-vertical/stepper:scale-x-100 group-data-vertical/stepper:scale-y-0 group-data-vertical/stepper:data-filled:scale-y-100"
      />
    </span>
  </StepperSeparator>
</template>

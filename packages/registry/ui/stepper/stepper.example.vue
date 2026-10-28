<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const steps = [
  { step: 1, title: 'Cart', description: '2 items' },
  { step: 2, title: 'Address', description: 'Where it ships' },
  { step: 3, title: 'Payment', description: 'How you pay' },
  { step: 4, title: 'Review', description: 'Check and confirm' },
]
</script>

<template>
  <Stepper
    :default-value="3"
    aria-label="Checkout"
    class="w-3xl max-w-full"
    v-bind="$attrs">
    <StepperItem
      v-for="item in steps"
      :key="item.step"
      v-slot="{ state }"
      :step="item.step">
      <StepperTrigger>
        <StepperIndicator>
          <IconPlaceholder
            v-if="state === 'completed'"
            lucide="CheckIcon"
            tabler="IconCheck"
            hugeicons="Tick02Icon"
            phosphor="CheckIcon"
            remixicon="RiCheckLine"
            data-icon />
          <template v-else>{{ item.step }}</template>
        </StepperIndicator>
        <StepperTitle>{{ item.title }}</StepperTitle>
        <StepperDescription>{{ item.description }}</StepperDescription>
      </StepperTrigger>
      <StepperSeparator v-if="item.step !== steps.length" />
    </StepperItem>
  </Stepper>
</template>

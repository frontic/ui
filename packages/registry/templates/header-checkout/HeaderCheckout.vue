<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Separator } from '@library/components/ui/separator'
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '@library/components/ui/stepper'
import { IconPlaceholder } from '@registry/icon-placeholder'
import type { CheckoutStep } from './types'
import { interpolate } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The checkout steps in order; `value` shows in each step's circle. */
    steps: CheckoutStep[]
    /** The current step, by `value`; earlier steps show a check. */
    step: number
    /** Shown as the logo, or as the logo image's alt text when `logoSrc` is set. */
    logoText?: string
    /** URL of the logo image; `logoText` shows in its place when empty. */
    logoSrc?: string
    /** Where the logo links to. */
    homeHref?: string
    /** Screen-reader name of the step list. */
    stepsLabel?: string
    /** Says where the shopper is when the band is too narrow to name every step; `{step}` and `{total}` stand for the position and the step count. */
    progressLabel?: string
    /** Shown next to the lock icon on wider screens. */
    secureLabel?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    logoText: 'STORE',
    logoSrc: '',
    homeHref: '/',
    stepsLabel: 'Checkout steps',
    progressLabel: 'Step {step} of {total}',
    secureLabel: 'Secure Checkout',
  },
)
defineSlots<{
  /** Replaces the checkout stepper in the band; gets the steps and the current step. */
  navigation?: (props: { steps: CheckoutStep[]; step: number }) => unknown
}>()

const index = computed(() => props.steps.findIndex((s) => s.value === props.step))
const progress = computed(() => interpolate(props.progressLabel, { step: String(index.value + 1), total: String(props.steps.length) }))
</script>

<template>
  <header data-slot="header-checkout" :class="['fui-header-checkout @container relative', props.class]">
    <div class="mx-auto flex h-16 w-full max-w-384 items-center justify-between gap-6 px-4 @2xl:px-6 @5xl:px-8">
      <a :href="homeHref" data-slot="logo" class="fui-logo outline-none focus-visible:fui-focus-ring">
        <img v-if="logoSrc" :src="logoSrc" :alt="logoText" class="h-8 w-auto" />
        <template v-else>{{ logoText }}</template>
      </a>
      <div data-slot="hint" class="fui-hint">
        <div class="flex items-center gap-1.5">
          <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon class="size-4" />
          <span class="hidden @2xl:inline">{{ secureLabel }}</span>
        </div>
      </div>
    </div>
    <template v-if="$slots.navigation || index >= 0">
      <Separator />
      <div data-slot="header-checkout-steps" class="mx-auto w-full max-w-3xl px-4 py-4 @2xl:px-6">
        <slot name="navigation" :steps="steps" :step="step">
          <Stepper :model-value="index + 1" :aria-label="stepsLabel" :status-label="() => progress">
            <StepperItem v-for="(item, at) in steps" :key="item.value" v-slot="{ state }" :step="at + 1">
              <StepperTrigger>
                <StepperIndicator>
                  <IconPlaceholder v-if="state === 'completed'" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
                  <template v-else>{{ item.value }}</template>
                </StepperIndicator>
                <StepperTitle>{{ item.label }}</StepperTitle>
              </StepperTrigger>
              <StepperSeparator v-if="at < steps.length - 1" />
            </StepperItem>
          </Stepper>
        </slot>
      </div>
    </template>
  </header>
</template>

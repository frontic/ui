<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed, inject } from 'vue'
import { ALERT_VARIANT } from './context'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div' },
)

const alertDescription = cva('fui-alert-description text-balance group-has-data-alert-action/alert:me-18 [&_p:not(:last-child)]:mb-4', {
  variants: {
    variant: {
      neutral: 'fui-alert-description-neutral',
      error: 'fui-alert-description-error',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

const variant = inject(
  ALERT_VARIANT,
  computed(() => 'neutral' as const),
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="alert-description" :class="[alertDescription({ variant: variant === 'error' ? 'error' : 'neutral' }), props.class]">
    <slot />
  </Primitive>
</template>

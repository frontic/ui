<script setup lang="ts">
import type { AcceptableValue, PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { injectRadioGroupRootContext, Primitive } from 'reka-ui'
import { computed, inject, provide, ref, toRef } from 'vue'
import { radioAccordionItem, radioAccordionVariant } from './keys'

const item = cva('fui-radio-accordion-item group/radio-accordion-item data-disabled:pointer-events-none data-disabled:fui-disabled', {
  variants: {
    variant: { plain: 'fui-radio-accordion-item-plain', outline: 'fui-radio-accordion-item-outline' },
  },
  defaultVariants: { variant: 'plain' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The value the group takes when this option is picked. */
      value: AcceptableValue
      /** Keeps the user from picking this option. */
      disabled?: boolean
    }
  >(),
  { as: 'div' },
)

const group = injectRadioGroupRootContext()
const variant = inject(radioAccordionVariant, ref('plain'))
const checked = computed(() => group.modelValue?.value === props.value)
const disabled = computed(() => props.disabled || group.disabled.value)

provide(radioAccordionItem, {
  value: toRef(() => props.value),
  disabled,
  checked,
})
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="radio-accordion-item"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled || undefined"
    :class="[item({ variant }), variant === 'plain' && 'last:border-b-0', props.class]"
  >
    <slot />
  </Primitive>
</template>

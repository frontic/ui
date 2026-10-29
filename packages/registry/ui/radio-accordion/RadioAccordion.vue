<script lang="ts">
/** Groups options of which the user picks one; the picked option reveals its details. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, RadioGroupRootEmits, RadioGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { RadioAccordionVariant } from './keys'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { RadioGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { provide, toRef, useTemplateRef } from 'vue'
import { checkedRadio, useFieldControl } from '@library/composables/use-field-control'
import { radioAccordionVariant } from './keys'

const radioAccordion = cva('fui-radio-accordion', {
  variants: {
    variant: { plain: 'fui-radio-accordion-plain', outline: 'fui-radio-accordion-outline' },
  },
  defaultVariants: { variant: 'plain' },
})

const props = withDefaults(
  defineProps<
    RadioGroupRootProps & {
      class?: HTMLAttributes['class']
      /** Whether the options stack into one bordered list or stand apart as framed cards. */
      variant?: RadioAccordionVariant
    }
  >(),
  { variant: 'plain' },
)
const emits = defineEmits<RadioGroupRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'variant'), emits)

defineSlots<{
  /** Holds the options; gets the selected value as `modelValue`. */
  default?: (props: { modelValue: AcceptableValue | undefined }) => unknown
}>()

// Delete once Reka's RadioGroup reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: checkedRadio,
})

provide(
  radioAccordionVariant,
  toRef(() => props.variant),
)
</script>

<template>
  <RadioGroupRoot ref="root" v-slot="slotProps" data-slot="radio-accordion" :data-variant="variant" :class="[radioAccordion({ variant }), props.class]" v-bind="joined" @update:model-value="report">
    <slot v-bind="slotProps" />
  </RadioGroupRoot>
</template>

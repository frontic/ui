<script lang="ts">
/** Groups radio items so the user can pick exactly one option. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, RadioGroupRootEmits, RadioGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { checkedRadio, useFieldControl } from '@library/composables/use-field-control'

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the radio items; gets the selected value as `modelValue`. */
  default?: (props: { modelValue: AcceptableValue | undefined }) => unknown
}>()

// Delete once Reka's RadioGroup reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: checkedRadio,
})
</script>

<template>
  <RadioGroupRoot ref="root" v-slot="slotProps" data-slot="radio-group" :class="['fui-radio-group group/radio-group', props.class]" v-bind="joined" @update:model-value="report">
    <slot v-bind="slotProps" />
  </RadioGroupRoot>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the number field. */
export default {}
</script>

<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NumberFieldRoot, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { useFieldControl } from '@library/composables/use-field-control'

const props = defineProps<NumberFieldRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<NumberFieldRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the field's input and buttons; gets the current number, its formatted text and whether the field is read-only. */
  default?: (props: { modelValue: number | undefined; textValue: string; readonly: boolean }) => unknown
}>()

// Delete once Reka's NumberField reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: (root) => root?.querySelector('input'),
  id: () => props.id,
  focus: 'none',
  aria: 'none',
  state: false,
})
</script>

<template>
  <NumberFieldRoot ref="root" v-slot="slotProps" v-bind="joined" data-slot="number-field" :class="['fui-number-field', props.class]" @update:model-value="report">
    <slot v-bind="slotProps" />
  </NumberFieldRoot>
</template>

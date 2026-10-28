<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the combobox, which lets the user search and pick an option. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, ComboboxRootEmits, ComboboxRootProps } from 'reka-ui'
import { ComboboxRoot, injectFieldRootContext, useForwardPropsEmits } from 'reka-ui'
import { computed, provide } from 'vue'
import { comboboxRequired } from './keys'

const props = defineProps<ComboboxRootProps>()
const emits = defineEmits<ComboboxRootEmits>()

defineSlots<{
  /** Holds the combobox's parts; gets whether the list is open and the selected value. */
  default?: (props: { open: boolean; modelValue: AcceptableValue | AcceptableValue[] }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)

// Takes the name and state of a Field around it; ComboboxTrigger joins the Field as its control. Delete once Reka's Combobox reads the Field itself.
const field = injectFieldRootContext(null)
provide(comboboxRequired, () => !!props.required)
const joined = computed(() =>
  field
    ? {
        ...forwarded.value,
        name: props.name ?? field.name.value,
        disabled: props.disabled || field.disabled.value,
        required: props.required || field.required.value,
      }
    : forwarded.value,
)
</script>

<template>
  <ComboboxRoot v-slot="slotProps" data-slot="combobox" v-bind="joined">
    <slot v-bind="slotProps" />
  </ComboboxRoot>
</template>

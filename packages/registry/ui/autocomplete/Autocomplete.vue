<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups all parts of the autocomplete, which lets the user type freely and pick from suggestions. */
export default {}
</script>

<script setup lang="ts">
import type { AutocompleteRootEmits, AutocompleteRootProps } from 'reka-ui'
import { AutocompleteRoot, injectFieldRootContext, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<AutocompleteRootProps>()
const emits = defineEmits<AutocompleteRootEmits>()

defineSlots<{
  /** Holds the autocomplete's parts; gets whether the suggestions are open and the text typed so far. */
  default?: (props: { open: boolean; modelValue: string }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)

// Takes the disabled state of a Field around it; AutocompleteInput joins the Field as its control. Delete once Reka's Autocomplete reads the Field itself.
const field = injectFieldRootContext(null)
const joined = computed(() => (field ? { ...forwarded.value, disabled: props.disabled || field.disabled.value } : forwarded.value))
</script>

<template>
  <AutocompleteRoot v-slot="slotProps" data-slot="autocomplete" v-bind="joined">
    <slot v-bind="slotProps" />
  </AutocompleteRoot>
</template>

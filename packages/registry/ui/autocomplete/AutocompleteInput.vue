<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Takes the text the user types; the suggestions filter as it changes. */
export default {}
</script>

<script setup lang="ts">
import type { AutocompleteInputEmits, AutocompleteInputProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteInput, FieldControl, injectAutocompleteRootContext, injectFieldRootContext, Slot, useForwardPropsEmits } from 'reka-ui'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<AutocompleteInputProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<AutocompleteInputEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Joins a Field around it through FieldControl, as Input does. Delete once Reka's Autocomplete reads the Field itself.
const field = injectFieldRootContext(null)
const autocomplete = injectAutocompleteRootContext()
</script>

<template>
  <component :is="field ? FieldControl : Slot" v-bind="field ? { asChild: true, modelValue: autocomplete.modelValue.value } : {}">
    <AutocompleteInput
      data-slot="autocomplete-input"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="[
        'fui-autocomplete-input border-0 focus-visible:border-b-0 bg-transparent outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:fui-disabled group-has-[>[data-align=inline-start]]/input-group:ps-2 group-has-[>[data-align=inline-end]]/input-group:pe-2',
        props.class,
      ]"
    />
  </component>
</template>

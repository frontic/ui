<script lang="ts">
/** Lets the user type a number into the number field. */
export default {}
</script>

<script setup lang="ts">
import type { NumberFieldInputProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { injectFieldRootContext, NumberFieldInput, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<NumberFieldInputProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

// Takes the Field's label, description and state, as Reka's Checkbox does. Delete once Reka's NumberField reads the Field itself.
const field = injectFieldRootContext(null)
const fieldAttrs = computed(() =>
  field
    ? {
        ...field.dataAttributes.value,
        'aria-labelledby': field.labelId.value,
        'aria-describedby': field.describedBy.value,
        'aria-invalid': (field.invalid.value && !field.disabled.value) || undefined,
        onFocus: () => field.handleControlFocus(),
        onBlur: () => field.handleControlBlur(),
      }
    : {},
)
</script>

<template>
  <NumberFieldInput
    v-bind="{ ...fieldAttrs, ...forwarded }"
    data-slot="number-field-input"
    :class="['fui-number-field-input outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:fui-disabled', props.class]"
  />
</template>

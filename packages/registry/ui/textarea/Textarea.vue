<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { FieldControl, injectFieldRootContext, Slot } from 'reka-ui'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** The starting value when the field is not bound with v-model. */
  defaultValue?: string | number
  /** The field's value, bound with v-model. */
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

/** Inside a Field the textarea joins it through Reka's FieldControl; elsewhere it renders alone. Both roots keep the child's own data-slot over a wrapper's, so the template takes a wrapper's from $attrs. */
const field = injectFieldRootContext(null)
</script>

<template>
  <component :is="field ? FieldControl : Slot" v-bind="field ? { asChild: true, modelValue } : {}">
    <textarea
      v-model="modelValue"
      :data-slot="$attrs['data-slot'] ?? 'textarea'"
      :class="['field-sizing-content resize-none outline-none transition-colors fui-textarea disabled:cursor-not-allowed disabled:fui-disabled', props.class]"
    />
  </component>
</template>

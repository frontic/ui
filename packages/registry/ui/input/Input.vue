<script lang="ts">
/** Lets the user enter a single line of text. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cva, type VariantProps } from 'class-variance-authority'
import { FieldControl, injectFieldRootContext, Slot } from 'reka-ui'

const input = cva('outline-none transition-colors fui-input file:h-7 disabled:pointer-events-none disabled:cursor-not-allowed disabled:fui-disabled', {
  variants: {
    size: { md: 'fui-input-md', sm: 'fui-input-sm' },
  },
  defaultVariants: { size: 'md' },
})

const props = defineProps<{
  /** The starting value when the field is not bound with v-model. */
  defaultValue?: string | number
  /** The field's value, bound with v-model. */
  modelValue?: string | number
  class?: HTMLAttributes['class']
  /** The height of the input. */
  size?: VariantProps<typeof input>['size']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

/** Inside a Field the input joins it through Reka's FieldControl; elsewhere it renders alone. Both roots keep the child's own data-slot over a wrapper's, so the template takes a wrapper's from $attrs. */
const field = injectFieldRootContext(null)
</script>

<template>
  <component :is="field ? FieldControl : Slot" v-bind="field ? { asChild: true, modelValue } : {}">
    <input v-model="modelValue" :data-slot="$attrs['data-slot'] ?? 'input'" :data-size="props.size ?? 'md'" :class="[input({ size: props.size }), props.class]" />
  </component>
</template>

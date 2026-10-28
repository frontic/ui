<script setup lang="ts">
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Field>
    <FieldLabel>Quantity</FieldLabel>
    <NumberField :default-value="1" :min="1" :max="10" v-bind="$attrs">
      <NumberFieldContent>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldContent>
    </NumberField>
    <FieldDescription>Up to 10 per order.</FieldDescription>
  </Field>
</template>

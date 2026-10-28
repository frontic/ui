<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { DateField } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Field name="arrival" class="w-xs max-w-full">
    <FieldLabel :native-label="false">Arrival at the Basecamp store</FieldLabel>
    <DateField v-bind="$attrs" />
    <FieldDescription
      >We hold your order for seven days from this date.</FieldDescription
    >
  </Field>
</template>

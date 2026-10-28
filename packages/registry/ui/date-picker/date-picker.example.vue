<script setup lang="ts">
import { getLocalTimeZone, isWeekend, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { DatePicker } from '.'

defineOptions({ inheritAttrs: false })

const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
const closed = (date: DateValue) => isWeekend(date, 'de-DE')
</script>

<template>
  <Field name="pickup" class="w-xs max-w-full">
    <FieldLabel :native-label="false">Pick up at the Basecamp store</FieldLabel>
    <DatePicker
      :min-value="tomorrow"
      :is-date-unavailable="closed"
      v-bind="$attrs" />
    <FieldDescription>Open Monday to Friday; from tomorrow.</FieldDescription>
  </Field>
</template>

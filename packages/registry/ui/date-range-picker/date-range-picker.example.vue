<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { DateRangePicker } from '.'

defineOptions({ inheritAttrs: false })

const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
</script>

<template>
  <Field name="away" class="w-sm max-w-full">
    <FieldLabel :native-label="false"
      >Pause deliveries while you're away</FieldLabel
    >
    <DateRangePicker :min-value="tomorrow" :maximum-days="28" v-bind="$attrs" />
    <FieldDescription
      >We hold your parcels at the Basecamp store, for up to four
      weeks.</FieldDescription
    >
  </Field>
</template>

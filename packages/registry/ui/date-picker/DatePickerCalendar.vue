<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** The calendar a date picker opens: our Calendar, driven by the picker's date and settings. */
export default {}
</script>

<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import type { LayoutTypes } from '@library/components/ui/calendar'
import { isEqualDay } from '@internationalized/date'
import { injectDatePickerRootContext } from 'reka-ui'
import { Calendar } from '@library/components/ui/calendar'

defineProps<{
  /** Replaces the month heading with month and/or year dropdowns. */
  layout?: LayoutTypes
}>()

const picker = injectDatePickerRootContext()

function pick(date: DateValue | undefined) {
  if (date && picker.modelValue.value && isEqualDay(date, picker.modelValue.value)) return
  picker.onDateChange(date)
}

function page(date: DateValue) {
  if (!isEqualDay(date, picker.placeholder.value)) picker.onPlaceholderChange(date)
}
</script>

<template>
  <Calendar
    :model-value="picker.modelValue.value"
    :placeholder="picker.placeholder.value"
    :layout="layout"
    :is-date-disabled="picker.isDateDisabled"
    :is-date-unavailable="picker.isDateUnavailable"
    :min-value="picker.minValue.value"
    :max-value="picker.maxValue.value"
    :locale="picker.locale.value"
    :disabled="picker.disabled.value"
    :paged-navigation="picker.pagedNavigation.value"
    :week-starts-on="picker.weekStartsOn.value"
    :weekday-format="picker.weekdayFormat.value"
    :fixed-weeks="picker.fixedWeeks.value"
    :number-of-months="picker.numberOfMonths.value"
    :readonly="picker.readonly.value"
    :prevent-deselect="picker.preventDeselect.value"
    :dir="picker.dir.value"
    @update:model-value="pick"
    @update:placeholder="page"
  />
</template>

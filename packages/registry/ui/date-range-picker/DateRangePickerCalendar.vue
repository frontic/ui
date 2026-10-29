<script lang="ts">
/** The calendar a date range picker opens: our RangeCalendar, driven by the picker's dates and settings. */
export default {}
</script>

<script setup lang="ts">
import type { DateRange, DateValue } from 'reka-ui'
import { isEqualDay } from '@internationalized/date'
import { injectDateRangePickerRootContext } from 'reka-ui'
import { RangeCalendar } from '@library/components/ui/range-calendar'

const picker = injectDateRangePickerRootContext()

const same = (a: DateValue | undefined, b: DateValue | undefined) => !!a && !!b && isEqualDay(a, b)

function pick(range: DateRange) {
  const current = picker.modelValue.value
  if (same(range.start, current.start) && same(range.end, current.end)) return
  picker.onDateChange(range)
}

function page(date: DateValue) {
  if (!isEqualDay(date, picker.placeholder.value)) picker.onPlaceholderChange(date)
}
</script>

<template>
  <RangeCalendar
    :model-value="picker.modelValue.value"
    :placeholder="picker.placeholder.value"
    :allow-non-contiguous-ranges="picker.allowNonContiguousRanges.value"
    :is-date-disabled="picker.isDateDisabled"
    :is-date-unavailable="picker.isDateUnavailable"
    :is-date-highlightable="picker.isDateHighlightable"
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
    :fixed-date="picker.fixedDate.value"
    :maximum-days="picker.maximumDays?.value"
    :dir="picker.dir.value"
    @update:model-value="pick"
    @update:start-value="picker.onStartValueChange"
    @update:placeholder="page"
  />
</template>

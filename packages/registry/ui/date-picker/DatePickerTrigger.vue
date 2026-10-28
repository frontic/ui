<script lang="ts">
/** The calendar button at the end of a DatePicker's or DateRangePicker's field. */
export default {}
</script>

<script setup lang="ts">
import { DatePickerTrigger, DateRangePickerTrigger, injectDateRangePickerRootContext } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

withDefaults(
  defineProps<{
    /** Names the button for screen readers. */
    label?: string
  }>(),
  { label: 'Open calendar' },
)

const range = injectDateRangePickerRootContext(null)
</script>

<template>
  <component
    :is="range ? DateRangePickerTrigger : DatePickerTrigger"
    data-slot="date-picker-trigger"
    :aria-label="label"
    class="fui-date-picker-trigger outline-none transition-colors focus-visible:fui-focus-ring disabled:pointer-events-none"
  >
    <IconPlaceholder lucide="CalendarIcon" tabler="IconCalendar" hugeicons="Calendar03Icon" phosphor="CalendarBlankIcon" remixicon="RiCalendarLine" data-icon />
  </component>
</template>

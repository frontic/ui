<script setup lang="ts">
import {
  CalendarDate,
  getDayOfWeek,
  type DateValue,
} from '@internationalized/date'
import { ref, type Ref } from 'vue'
import { DeliverySlot, type DeliveryWindow } from '.'

defineOptions({ inheritAttrs: false })

// Pinned to October 2026, so the demo reads the same on every day it is shown.
const first = new CalendarDate(2026, 10, 12)
const fullyBooked = new CalendarDate(2026, 10, 16)
const unavailable = (date: DateValue) =>
  getDayOfWeek(date, 'en-GB') > 4 || date.compare(fullyBooked) === 0

const windows: DeliveryWindow[] = [
  { value: '08-12', label: '8–12', detail: '08:00–12:00' },
  { value: '12-16', label: '12–16', detail: '12:00–16:00' },
  { value: '16-20', label: '16–20', detail: '16:00–20:00' },
  { value: '18-21', label: '18–21', detail: '18:00–21:00', full: true },
]

const day = ref(new CalendarDate(2026, 10, 14)) as Ref<DateValue>
const timeWindow = ref('16-20')
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <DeliverySlot
      v-model:day="day"
      v-model:window="timeWindow"
      :windows="windows"
      description="Pick a day and a time window. Free shipping and returns on all orders."
      :express-notice="{
        title: 'Tomorrow before noon',
        description:
          'Order by 14:00 today and it arrives on Friday, 9 October.',
      }"
      day-hint="Weekdays only. Friday the 16th is fully booked."
      :default-placeholder="first"
      :min-value="first"
      :max-value="first.add({ days: 18 })"
      :is-date-unavailable="unavailable"
      locale="en-GB"
      :week-starts-on="1"
      :price="{ amount: 0, currency: 'EUR' }"
      v-bind="$attrs" />
  </div>
</template>

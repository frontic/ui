<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { shallowRef } from 'vue'
import { Calendar } from '.'

defineOptions({ inheritAttrs: false })

// A few days from today, stepping back instead near the month's end so the
// calendar opens on today's month.
const near = (days: number) => {
  const now = today(getLocalTimeZone())
  const ahead = now.add({ days })
  return ahead.month === now.month ? ahead : now.subtract({ days })
}
const delivery = shallowRef<DateValue>(near(3))
const pickup = shallowRef<DateValue>(near(5))
</script>

<template>
  <div class="flex flex-wrap items-start justify-center gap-8">
    <div class="border border-border p-4">
      <Calendar v-model="delivery" v-bind="$attrs" />
    </div>
    <div class="border border-border p-4">
      <Calendar v-model="pickup" layout="month-and-year" />
    </div>
  </div>
</template>

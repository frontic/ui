<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { shallowRef } from 'vue'
import { RangeCalendar } from '.'

defineOptions({ inheritAttrs: false })

const start = today(getLocalTimeZone()).add({ days: 3 })
const stay = shallowRef<DateRange>({ start, end: start.add({ days: 4 }) })
</script>

<template>
  <RangeCalendar v-model="stay" :number-of-months="2" v-bind="$attrs" />
</template>

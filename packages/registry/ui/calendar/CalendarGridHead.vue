<script lang="ts">
/** Holds the row of weekday names above the calendar days. */
export default {}
</script>

<script lang="ts" setup>
import type { CalendarGridHeadProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { CalendarGridHead, useForwardProps } from 'reka-ui'

const props = defineProps<CalendarGridHeadProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(props)
</script>

<template>
  <CalendarGridHead data-slot="calendar-grid-head" v-bind="forwarded">
    <slot />
  </CalendarGridHead>
</template>

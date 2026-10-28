<script lang="ts">
/** Holds the week rows of one month. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarGridBodyProps } from 'reka-ui'
import { RangeCalendarGridBody, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarGridBodyProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <RangeCalendarGridBody data-slot="range-calendar-grid-body" v-bind="forwarded">
    <slot />
  </RangeCalendarGridBody>
</template>

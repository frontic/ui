<script lang="ts" setup>
import type { RangeCalendarGridHeadProps } from 'reka-ui'
import { RangeCalendarGridHead, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarGridHeadProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <RangeCalendarGridHead data-slot="range-calendar-grid-head" v-bind="forwarded">
    <slot />
  </RangeCalendarGridHead>
</template>

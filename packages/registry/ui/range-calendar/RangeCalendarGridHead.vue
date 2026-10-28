<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds the row of weekday names above the days. */
export default {}
</script>

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

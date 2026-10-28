<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds the weeks of the calendar grid. */
export default {}
</script>

<script lang="ts" setup>
import type { CalendarGridBodyProps } from 'reka-ui'
import { CalendarGridBody, useForwardProps } from 'reka-ui'

const props = defineProps<CalendarGridBodyProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <CalendarGridBody data-slot="calendar-grid-body" v-bind="forwarded">
    <slot />
  </CalendarGridBody>
</template>

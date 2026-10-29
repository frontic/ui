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

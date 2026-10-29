<script lang="ts">
/** Groups the days of one week in the calendar grid. */
export default {}
</script>

<script lang="ts" setup>
import type { CalendarGridRowProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarGridRow, useForwardProps } from 'reka-ui'

const props = defineProps<CalendarGridRowProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarGridRow data-slot="calendar-grid-row" :class="['fui-calendar-grid-row', props.class]" v-bind="forwardedProps">
    <slot />
  </CalendarGridRow>
</template>

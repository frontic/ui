<script lang="ts">
/** Groups the cells of one week, or the weekday names. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarGridRowProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarGridRow, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarGridRowProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarGridRow data-slot="range-calendar-grid-row" :class="['fui-range-calendar-grid-row', props.class]" v-bind="forwardedProps">
    <slot />
  </RangeCalendarGridRow>
</template>

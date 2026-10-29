<script lang="ts">
/** Lets the user select a day as part of the date range. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarCellTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { getLocalTimeZone, isSameMonth, isToday } from '@internationalized/date'
import { injectRangeCalendarRootContext, RangeCalendarCellTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<RangeCalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'button',
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
const cellTrigger = cva(
  'fui-range-calendar-cell-trigger group/button whitespace-nowrap bg-clip-padding outline-none transition-all select-none focus-visible:fui-focus-ring aria-invalid:fui-invalid disabled:pointer-events-none aria-disabled:fui-disabled data-unavailable:line-through **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      day: {
        current: 'fui-range-calendar-cell-trigger-current',
        today: 'fui-range-calendar-cell-trigger-today',
        outside: 'fui-range-calendar-cell-trigger-outside',
      },
      position: {
        middle: 'fui-range-calendar-cell-trigger-middle',
        edge: 'fui-range-calendar-cell-trigger-edge',
      },
    },
    defaultVariants: { day: 'current', position: 'middle' },
  },
)

const day = computed(() => (isToday(props.day, getLocalTimeZone()) ? 'today' : isSameMonth(props.day, props.month) ? 'current' : 'outside'))
const root = injectRangeCalendarRootContext()
const position = computed(() => (root.isSelectionStart(props.day) || root.isSelectionEnd(props.day) ? 'edge' : 'middle'))
</script>

<template>
  <RangeCalendarCellTrigger data-slot="range-calendar-trigger" :class="[cellTrigger({ day, position }), props.class]" v-bind="forwardedProps">
    <slot />
  </RangeCalendarCellTrigger>
</template>

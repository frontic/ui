<script lang="ts" setup>
import type { CalendarCellTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { getLocalTimeZone, isSameMonth, isToday } from '@internationalized/date'
import { CalendarCellTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'button',
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
const cellTrigger = cva(
  'fui-calendar-cell-trigger group/button cursor-default whitespace-nowrap bg-clip-padding outline-none transition-all select-none focus-visible:fui-focus-ring aria-invalid:fui-invalid disabled:pointer-events-none aria-disabled:fui-disabled data-unavailable:line-through **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      day: {
        current: 'fui-calendar-cell-trigger-current',
        today: 'fui-calendar-cell-trigger-today',
        outside: 'fui-calendar-cell-trigger-outside',
      },
    },
    defaultVariants: { day: 'current' },
  },
)

const day = computed(() => (isToday(props.day, getLocalTimeZone()) ? 'today' : isSameMonth(props.day, props.month) ? 'current' : 'outside'))
</script>

<template>
  <CalendarCellTrigger data-slot="calendar-cell-trigger" :class="[cellTrigger({ day }), props.class]" v-bind="forwardedProps">
    <slot />
  </CalendarCellTrigger>
</template>

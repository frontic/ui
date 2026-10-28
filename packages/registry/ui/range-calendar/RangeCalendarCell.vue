<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds one day of the range calendar grid. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarCellProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectRangeCalendarRootContext, RangeCalendarCell, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<RangeCalendarCellProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
const cell = cva('fui-range-calendar-cell relative focus-within:relative focus-within:z-20', {
  variants: {
    edge: {
      none: 'fui-range-calendar-cell-none',
      start: 'fui-range-calendar-cell-start',
      end: 'fui-range-calendar-cell-end',
      both: 'fui-range-calendar-cell-both',
    },
  },
  defaultVariants: { edge: 'none' },
})

const root = injectRangeCalendarRootContext()
const edge = computed(() => {
  const start = root.isSelectionStart(props.date)
  const end = root.isSelectionEnd(props.date)
  return start && end ? 'both' : start ? 'start' : end ? 'end' : 'none'
})
</script>

<template>
  <RangeCalendarCell data-slot="range-calendar-cell" :class="[cell({ edge }), props.class]" v-bind="forwardedProps">
    <slot />
  </RangeCalendarCell>
</template>

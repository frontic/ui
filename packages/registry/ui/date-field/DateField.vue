<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the user type a date one segment at a time, in the order and format of their locale. Inside a DatePicker or DateRangePicker it takes the picker's dates and settings. */
export default {}
</script>

<script setup lang="ts">
import type { DateFieldRootEmits, DateFieldRootProps, DateRange, DateValue, SegmentPart } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DateFieldRoot, DatePickerField, DateRangePickerField, injectDatePickerRootContext, injectDateRangePickerRootContext, useForwardPropsEmits } from 'reka-ui'
import DateFieldInput from './DateFieldInput.vue'

type Segment = { part: SegmentPart; value: string }

const props = defineProps<DateFieldRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DateFieldRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
const picker = injectDatePickerRootContext(null)
const range = injectDateRangePickerRootContext(null)

defineSlots<{
  /** Replaces the segments; gets them, the date and, outside a picker, whether it falls outside the allowed range, to lay out with DateFieldInput. Inside a DateRangePicker the segments come split into start and end, and the picker lays them out. */
  default?: (props: { segments: Segment[] | { start: Segment[]; end: Segment[] }; modelValue: DateValue | DateRange | null | undefined; isInvalid?: boolean }) => unknown
  /** Sits after the segments, such as a picker's calendar button. */
  end?: () => unknown
}>()
</script>

<template>
  <DateRangePickerField
    v-if="range"
    v-slot="slotProps"
    data-slot="date-field"
    :class="['fui-date-field tabular-nums outline-none transition-colors data-disabled:cursor-not-allowed data-disabled:fui-disabled', props.class]"
  >
    <slot v-bind="slotProps" />
    <slot name="end" />
  </DateRangePickerField>
  <component
    :is="picker ? DatePickerField : DateFieldRoot"
    v-else
    v-slot="slotProps"
    data-slot="date-field"
    v-bind="picker ? {} : forwarded"
    :class="['fui-date-field tabular-nums outline-none transition-colors data-disabled:cursor-not-allowed data-disabled:fui-disabled', props.class]"
  >
    <slot v-bind="slotProps">
      <DateFieldInput v-for="(segment, index) in slotProps.segments" :key="index" :part="segment.part">{{ segment.value }}</DateFieldInput>
    </slot>
    <slot name="end" />
  </component>
</template>

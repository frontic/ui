<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the user type a date, or pick it from a calendar the button beside it opens. */
export default {}
</script>

<script setup lang="ts">
import type { DatePickerRootEmits, DatePickerRootProps, DateValue, SegmentPart } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { LayoutTypes } from '@library/components/ui/calendar'
import { reactiveOmit } from '@vueuse/core'
import { DatePickerAnchor, DatePickerRoot, useForwardPropsEmits } from 'reka-ui'
import { DateField } from '@library/components/ui/date-field'
import DatePickerCalendar from './DatePickerCalendar.vue'
import DatePickerContent from './DatePickerContent.vue'
import DatePickerTrigger from './DatePickerTrigger.vue'

type Segment = { part: SegmentPart; value: string }

const props = withDefaults(
  defineProps<
    DatePickerRootProps & {
      class?: HTMLAttributes['class']
      /** Replaces the calendar's month heading with month and/or year dropdowns. */
      layout?: LayoutTypes
      /** Names the calendar button for screen readers. */
      triggerLabel?: string
    }
  >(),
  { triggerLabel: 'Open calendar', closeOnSelect: true },
)
defineOptions({ inheritAttrs: false })

const emits = defineEmits<DatePickerRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'layout', 'triggerLabel'), emits)

defineSlots<{
  /** Replaces the segments; gets them and the date, to lay out with DateFieldInput. */
  default?: (props: { segments: Segment[]; modelValue: DateValue | undefined }) => unknown
}>()
</script>

<template>
  <DatePickerRoot v-bind="forwarded">
    <DatePickerAnchor as-child>
      <DateField v-bind="$attrs" data-slot="date-picker" :class="props.class">
        <template v-if="$slots.default" #default="slotProps">
          <slot v-bind="slotProps as { segments: Segment[]; modelValue: DateValue | undefined }" />
        </template>
        <template #end>
          <DatePickerTrigger :label="triggerLabel" />
        </template>
      </DateField>
    </DatePickerAnchor>
    <DatePickerContent>
      <DatePickerCalendar :layout="layout" />
    </DatePickerContent>
  </DatePickerRoot>
</template>

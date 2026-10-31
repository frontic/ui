<script setup lang="ts">
import type { DatePickerRootEmits, DatePickerRootProps, DateValue, SegmentPart } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { LayoutTypes } from '@library/components/ui/calendar'
import { getLocalTimeZone, toCalendarDate, toCalendarDateTime, today } from '@internationalized/date'
import { reactiveOmit } from '@vueuse/core'
import { DatePickerAnchor, DatePickerRoot, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
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

// Reka opens on today; when minValue or maxValue rule today out, open on the nearest day they allow.
const defaultPlaceholder = computed(() => {
  if (props.defaultPlaceholder || props.placeholder || props.modelValue || props.defaultValue) return props.defaultPlaceholder
  const now = today(getLocalTimeZone())
  const bound = props.minValue && now.compare(props.minValue) < 0 ? props.minValue : props.maxValue && now.compare(props.maxValue) > 0 ? props.maxValue : undefined
  if (!bound) return undefined
  const day = toCalendarDate(bound)
  return props.granularity && props.granularity !== 'day' ? toCalendarDateTime(day) : day
})

defineSlots<{
  /** Replaces the segments; gets them and the date, to lay out with DateFieldInput. */
  default?: (props: { segments: Segment[]; modelValue: DateValue | undefined }) => unknown
}>()
</script>

<template>
  <DatePickerRoot v-bind="forwarded" :default-placeholder="defaultPlaceholder">
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

<script lang="ts">
/** Lets the user type a start and an end date, or pick both from a calendar the button beside them opens. */
export default {}
</script>

<script setup lang="ts">
import type { DateRange, DateRangePickerRootEmits, DateRangePickerRootProps, SegmentPart } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DateRangePickerAnchor, DateRangePickerRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, nextTick, useTemplateRef } from 'vue'
import { DateField, DateFieldInput } from '@library/components/ui/date-field'
import { DatePickerContent, DatePickerTrigger } from '@library/components/ui/date-picker'
import DateRangePickerCalendar from './DateRangePickerCalendar.vue'
import { useFieldControl } from '@library/composables/use-field-control'

type Segment = { part: SegmentPart; value: string }

const props = withDefaults(
  defineProps<
    DateRangePickerRootProps & {
      class?: HTMLAttributes['class']
      /** Names the calendar button for screen readers. */
      triggerLabel?: string
      /** Sits between the start and the end. */
      separator?: string
    }
  >(),
  { triggerLabel: 'Open calendar', separator: '–', closeOnSelect: true },
)
defineOptions({ inheritAttrs: false })

const emits = defineEmits<DateRangePickerRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'triggerLabel', 'separator'), emits)

defineSlots<{
  /** Replaces the segments; gets the start's and the end's and the range, to lay out with DateFieldInput. */
  default?: (props: { segments: { start: Segment[]; end: Segment[] }; modelValue: DateRange }) => unknown
}>()

// Delete once Reka's DateRangePicker reads the Field itself; the group takes the aria and focus.
const group = useTemplateRef<{ $el: HTMLElement }>('group')
const { joined, report, field } = useFieldControl({
  props,
  forwarded,
  root: group,
  element: (root) => root?.querySelector<HTMLElement>('[data-reka-date-field-segment]:not([data-reka-date-field-segment="literal"])'),
  id: () => props.id,
  focus: 'none',
  aria: 'none',
  state: false,
  isFilled: (range) => !!(range as DateRange | undefined)?.start && !!(range as DateRange | undefined)?.end,
})
const fieldAttrs = computed(() =>
  field
    ? {
        ...field.dataAttributes.value,
        'aria-labelledby': field.labelId.value,
        'aria-describedby': field.describedBy.value,
        'aria-invalid': (!joined.value.disabled && field.invalid.value) || undefined,
        onFocusin: () => field.handleControlFocus(),
        onFocusout: (event: FocusEvent) => {
          const next = event.relatedTarget as HTMLElement | null
          // The calendar is teleported out of the group; moving into it is still picking.
          if (group.value?.$el.contains(next) || next?.closest('[data-slot="date-picker-content"]')) return
          field.handleControlBlur()
        },
      }
    : {},
)

// Focus leaving from the teleported calendar never reaches the group's focusout. Once the calendar closes, Reka sends focus back to the button unless the user moved it elsewhere.
async function closed() {
  if (!field) return
  await nextTick()
  if (!group.value?.$el.contains(document.activeElement)) field.handleControlBlur()
}
</script>

<template>
  <DateRangePickerRoot v-bind="joined" @update:model-value="report">
    <DateRangePickerAnchor as-child>
      <DateField ref="group" v-bind="{ ...$attrs, ...fieldAttrs }" data-slot="date-range-picker" :class="props.class">
        <template #default="slotProps">
          <slot v-bind="slotProps as { segments: { start: Segment[]; end: Segment[] }; modelValue: DateRange }">
            <template v-for="type in ['start', 'end'] as const" :key="type">
              <span v-if="type === 'end'" data-slot="date-range-picker-separator" aria-hidden="true" class="fui-date-range-picker-separator">{{ separator }}</span>
              <DateFieldInput v-for="(segment, index) in (slotProps.segments as { start: Segment[]; end: Segment[] })[type]" :key="index" :type="type" :part="segment.part">{{
                segment.value
              }}</DateFieldInput>
            </template>
          </slot>
        </template>
        <template #end>
          <DatePickerTrigger :label="triggerLabel" />
        </template>
      </DateField>
    </DateRangePickerAnchor>
    <DatePickerContent @close-auto-focus="closed">
      <DateRangePickerCalendar />
    </DatePickerContent>
  </DateRangePickerRoot>
</template>

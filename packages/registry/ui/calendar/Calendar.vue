<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps, DateValue } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import type { LayoutTypes } from '.'
import { getLocalTimeZone, toCalendarDate, today } from '@internationalized/date'
import type { ReuseTemplateComponent } from '@vueuse/core'
import { createReusableTemplate, reactiveOmit, useVModel } from '@vueuse/core'
import { CalendarRoot, useDateFormatter, useForwardPropsEmits, useLocale } from 'reka-ui'
import { createYear, createYearRange, toDate } from 'reka-ui/date'
import { computed, toRaw, toRef, watch } from 'vue'
import { NativeSelect, NativeSelectOption } from '@library/components/ui/native-select'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from '.'

const props = withDefaults(
  defineProps<
    CalendarRootProps & {
      class?: HTMLAttributes['class']
      /** Replaces the heading with month and/or year dropdowns for jumping across dates; the plain month heading when left out. */
      layout?: LayoutTypes
      /** The years the year dropdown offers; when left out, from `minValue` (or 100 years back) to `maxValue` (or 10 years ahead). */
      yearRange?: DateValue[]
    }
  >(),
  {
    modelValue: undefined,
    layout: undefined,
  },
)
const emits = defineEmits<CalendarRootEmits>()

defineSlots<{
  /** Replaces the month heading; gets the displayed month's date and the month and year dropdowns to place. */
  'calendar-heading'?: (props: {
    date: DateValue
    month: ReuseTemplateComponent<{ date: DateValue }, Record<'default', undefined>>
    year: ReuseTemplateComponent<{ date: DateValue }, Record<'default', undefined>>
  }) => unknown
  /** Replaces the icon on the previous-month button. */
  'calendar-prev-icon'?: () => unknown
  /** Replaces the icon on the next-month button. */
  'calendar-next-icon'?: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class', 'layout', 'placeholder')

// Today, or the nearest day minValue and maxValue allow.
function openingDay() {
  const now = today(getLocalTimeZone())
  if (props.minValue && now.compare(props.minValue) < 0) return toCalendarDate(props.minValue)
  if (props.maxValue && now.compare(props.maxValue) > 0) return toCalendarDate(props.maxValue)
  return now
}

const placeholder = useVModel(props, 'placeholder', emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? openingDay(),
}) as Ref<DateValue>

const locale = useLocale(toRef(() => props.locale))
const formatter = useDateFormatter(locale.value)
watch(locale, (value) => formatter.setLocale(value))

const yearRange = computed(() => {
  return (
    props.yearRange ??
    createYearRange({
      start: props?.minValue ?? (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone())).cycle('year', -100),

      end: props?.maxValue ?? (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone())).cycle('year', 10),
    })
  )
})

const [DefineMonthTemplate, ReuseMonthTemplate] = createReusableTemplate<{ date: DateValue }>()
const [DefineYearTemplate, ReuseYearTemplate] = createReusableTemplate<{ date: DateValue }>()

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DefineMonthTemplate v-slot="{ date }">
    <div class="[&_[data-slot=native-select-icon]]:inset-e-1">
      <div class="relative">
        <div class="fui-calendar-select-label pointer-events-none absolute inset-0 flex h-full items-center">
          {{ formatter.custom(toDate(date), { month: 'short' }) }}
        </div>
        <NativeSelect
          size="sm"
          class="relative text-transparent"
          @change="
            (e: Event) => {
              placeholder = placeholder.set({
                month: Number((e?.target as any)?.value),
              })
            }
          "
        >
          <NativeSelectOption v-for="month in createYear({ dateObj: date })" :key="month.toString()" :value="month.month" :selected="date.month === month.month">
            {{ formatter.custom(toDate(month), { month: 'short' }) }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  </DefineMonthTemplate>

  <DefineYearTemplate v-slot="{ date }">
    <div class="[&_[data-slot=native-select-icon]]:inset-e-1">
      <div class="relative">
        <div class="fui-calendar-select-label pointer-events-none absolute inset-0 flex h-full items-center">
          {{ formatter.custom(toDate(date), { year: 'numeric' }) }}
        </div>
        <NativeSelect
          size="sm"
          class="relative text-transparent"
          @change="
            (e: Event) => {
              placeholder = placeholder.set({
                year: Number((e?.target as any)?.value),
              })
            }
          "
        >
          <NativeSelectOption v-for="year in yearRange" :key="year.toString()" :value="year.year" :selected="date.year === year.year">
            {{ formatter.custom(toDate(year), { year: 'numeric' }) }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  </DefineYearTemplate>

  <CalendarRoot v-slot="{ grid, weekDays, date }" v-bind="forwarded" v-model:placeholder="placeholder" data-slot="calendar" :class="['fui-calendar group/calendar', props.class]">
    <CalendarHeader>
      <slot name="calendar-heading" :date="date" :month="ReuseMonthTemplate" :year="ReuseYearTemplate">
        <template v-if="layout === 'month-and-year'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else-if="layout === 'month-only'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            {{ formatter.custom(toDate(date), { year: 'numeric' }) }}
          </div>
        </template>
        <template v-else-if="layout === 'year-only'">
          <div class="flex items-center justify-center gap-1">
            {{ formatter.custom(toDate(date), { month: 'short' }) }}
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else>
          <CalendarHeading />
        </template>
      </slot>

      <nav class="pointer-events-none flex items-center gap-1 absolute top-0 inset-x-0 justify-between">
        <CalendarPrevButton>
          <slot name="calendar-prev-icon" />
        </CalendarPrevButton>
        <CalendarNextButton>
          <slot name="calendar-next-icon" />
        </CalendarNextButton>
      </nav>
    </CalendarHeader>

    <div class="mt-4 flex flex-wrap justify-center gap-4">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell v-for="day in weekDays" :key="day">
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
            <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
              <CalendarCellTrigger :day="weekDate" :month="month.value" />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { HTMLAttributes } from 'vue'
import type { DeliveryNotice, DeliveryWindow } from './types'
import { computed, ref, toRef, watch } from 'vue'
import { formatDate, formatPrice, type PriceType } from '@library/lib/format'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Alert, AlertDescription, AlertTitle } from '@library/components/ui/alert'
import { Button } from '@library/components/ui/button'
import { Calendar } from '@library/components/ui/calendar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@library/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@library/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@library/components/ui/toggle-group'
import { useLocale } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    /** The delivery windows offered for the chosen day, one toggle each. */
    windows: DeliveryWindow[]
    /** The card's heading. */
    title?: string
    /** Shown under the heading. */
    description?: string
    /** Shown on the tab for standard delivery. */
    standardLabel?: string
    /** Shown on the tab for express delivery. */
    expressLabel?: string
    /** What the express tab says instead of the day and window pickers. */
    expressNotice?: DeliveryNotice
    /** Shown above the calendar. */
    dayLabel?: string
    /** Shown under the calendar, e.g. how far ahead a day can be booked. */
    dayHint?: string
    /** The month the calendar opens on when no day is chosen. */
    defaultPlaceholder?: DateValue
    /** The earliest day the shopper can pick. */
    minValue?: DateValue
    /** The latest day the shopper can pick. */
    maxValue?: DateValue
    /** Returns true for a day that cannot be booked, such as a Sunday or holiday. */
    isDateUnavailable?: (date: DateValue) => boolean
    /** BCP 47 locale for the calendar and the chosen day in the summary, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** The calendar's first weekday, from 0 for Sunday to 6 for Saturday. */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    /** Shown above the delivery windows. */
    windowLabel?: string
    /** Builds each window toggle's screen-reader name from its label. */
    windowAriaLabel?: (label: string) => string
    /** Read after a fully booked window's name. */
    fullLabel?: string
    /** Shown under the calendar when the shopper confirms standard delivery without a day. */
    dayRequiredLabel?: string
    /** Shown under the windows when the shopper confirms standard delivery without a window. */
    windowRequiredLabel?: string
    /** The slot's price: `amount` in minor units such as cents, `currency` as an ISO 4217 code. */
    price?: PriceType
    /** Shown in place of the price when it is 0. */
    freeLabel?: string
    /** Builds the summary above the button from the chosen day and window; the formatted day and the window's time when left out. */
    slotLabel?: (day: DateValue | undefined, window: DeliveryWindow | undefined) => string
    /** Shown on the button that confirms the delivery slot. */
    confirmLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Delivery',
    standardLabel: 'Standard',
    expressLabel: 'Express',
    dayLabel: 'Day',
    locale: 'en',
    weekStartsOn: 0,
    windowLabel: 'Time window',
    freeLabel: 'Free',
    windowAriaLabel: (label: string) => `Between ${label}`,
    fullLabel: 'Fully booked',
    dayRequiredLabel: 'Choose a day',
    windowRequiredLabel: 'Choose a time window',
    confirmLabel: 'Confirm delivery slot',
  },
)
const locale = useLocale(toRef(() => props.locale))
const priceText = computed(() => (props.price ? (props.price.amount === 0 ? props.freeLabel : formatPrice(props.price, locale.value)) : undefined))
const emit = defineEmits<{
  /** Fires when the shopper confirms: with the day and time window for standard delivery, which needs both, and with the speed alone for express. */
  confirm: [slot: { speed: string; day?: DateValue; window?: string }]
}>()
/** The chosen delivery speed, `standard` or `express`. */
const speed = defineModel<string>('speed', { default: 'standard' })
/** The chosen delivery day. */
const day = defineModel<DateValue | undefined>('day')
/** The chosen delivery window, by its `value`. */
const timeWindow = defineModel<string | undefined>('window')

const dayMissing = ref(false)
const windowMissing = ref(false)
watch(day, () => (dayMissing.value = false))
watch(timeWindow, () => (windowMissing.value = false))

function confirm() {
  if (speed.value !== 'standard') return emit('confirm', { speed: speed.value })
  dayMissing.value = !day.value
  windowMissing.value = !timeWindow.value
  if (dayMissing.value || windowMissing.value) return
  emit('confirm', { speed: speed.value, day: day.value, window: timeWindow.value })
}

const chosenWindow = computed(() => props.windows.find((w) => w.value === timeWindow.value))
const slot = computed(() => {
  if (props.slotLabel) return props.slotLabel(day.value, chosenWindow.value)
  const date = day.value && formatDate(day.value, { weekday: 'long', day: 'numeric', month: 'long' }, locale.value)
  const time = chosenWindow.value && (chosenWindow.value.detail ?? chosenWindow.value.label)
  return [date, time].filter(Boolean).join(' · ')
})
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs v-model="speed" class="flex flex-col gap-6">
        <TabsList class="w-full">
          <TabsTrigger value="standard">
            <IconPlaceholder lucide="TruckIcon" tabler="IconTruck" hugeicons="TruckIcon" phosphor="TruckIcon" remixicon="RiTruckLine" data-icon />
            {{ standardLabel }}
          </TabsTrigger>
          <TabsTrigger value="express">
            <IconPlaceholder lucide="ZapIcon" tabler="IconBolt" hugeicons="FlashIcon" phosphor="LightningIcon" remixicon="RiFlashlightLine" data-icon />
            {{ expressLabel }}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standard">
          <FieldGroup>
            <Field :invalid="dayMissing">
              <FieldLabel>{{ dayLabel }}</FieldLabel>
              <Calendar
                v-model="day"
                :default-placeholder="defaultPlaceholder"
                :min-value="minValue"
                :max-value="maxValue"
                :is-date-unavailable="isDateUnavailable"
                :locale="locale"
                :week-starts-on="weekStartsOn"
                class="self-center"
              />
              <FieldDescription v-if="dayHint">{{ dayHint }}</FieldDescription>
              <FieldError v-if="dayMissing" :errors="[dayRequiredLabel]" />
            </Field>
            <Field :invalid="windowMissing">
              <FieldLabel>{{ windowLabel }}</FieldLabel>
              <ToggleGroup :model-value="timeWindow ?? ''" type="single" variant="outline" class="w-full" @update:model-value="timeWindow = ($event as string) || timeWindow">
                <ToggleGroupItem
                  v-for="w in windows"
                  :key="w.value"
                  :value="w.value"
                  :disabled="w.full"
                  :aria-label="w.full ? `${windowAriaLabel(w.label)}, ${fullLabel}` : windowAriaLabel(w.label)"
                  class="flex-1"
                >
                  {{ w.label }}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldError v-if="windowMissing" :errors="[windowRequiredLabel]" />
            </Field>
          </FieldGroup>
        </TabsContent>
        <TabsContent v-if="expressNotice" value="express">
          <Alert variant="info">
            <template #icon><IconPlaceholder lucide="ZapIcon" tabler="IconBolt" hugeicons="FlashIcon" phosphor="LightningIcon" remixicon="RiFlashlightLine" data-icon /></template>
            <AlertTitle>{{ expressNotice.title }}</AlertTitle>
            <AlertDescription v-if="expressNotice.description">{{ expressNotice.description }}</AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </CardContent>
    <CardFooter class="flex-col items-stretch gap-4">
      <div v-if="slot || priceText" class="flex items-center justify-between gap-2">
        <span data-slot="hint" class="fui-hint">{{ slot }}</span>
        <span v-if="priceText" data-slot="delivery-slot-price" class="fui-delivery-slot-price">{{ priceText }}</span>
      </div>
      <Button color="checkout" class="w-full" @click="confirm">{{ confirmLabel }}</Button>
    </CardFooter>
  </Card>
</template>

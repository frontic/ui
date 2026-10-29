<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { type PriceType, formatPrice } from '@library/lib/format'
import { reactiveOmit } from '@vueuse/core'
import FilterSlider from './FilterSlider.vue'
import { useLocale } from 'reka-ui'
import { toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown as the filter's title, e.g. `Price`. */
    label?: string
    /** Shown as a hint below the title. */
    description?: string
    /** Names the slider for screen readers when its title sits outside it, e.g. on an accordion trigger or a popover button. */
    ariaLabel?: string
    /** ISO 4217 code the amounts are shown in, e.g. `EUR`. */
    currency?: string
    /** Decimal places of the currency; amounts are in its minor unit, so `2` means cents. */
    precision?: number
    /** BCP 47 locale for formatting the amounts; the ConfigProvider's when left out. */
    locale?: string
    /** Lowest price on the slider, in the currency's minor unit, e.g. cents. */
    min?: number
    /** Highest price on the slider, in the currency's minor unit, e.g. cents. */
    max?: number
    /** Amount the slider moves per step, in the currency's minor unit, e.g. cents. */
    step?: number
    /** The selected price range in minor units; with only `to`, a single handle sets the highest price. */
    value?: { from?: number; to?: number }
    /** Greys out the slider so the shopper cannot change it. */
    disabled?: boolean
    /** Builds the text shown for a single-handle maximum from the formatted price. */
    upTo?: (value: string) => string
  }>(),
  {
    upTo: (value: string) => `Up to ${value}`,
    currency: 'EUR',
    precision: 2,
    min: 0,
    max: 100000,
    step: 100,
    disabled: false,
  },
)
const locale = useLocale(toRef(() => props.locale))

const emit = defineEmits<{
  /** Fires with the selected range in minor units as the user moves the slider; with a single handle, only `to`. */
  change: [value: { from?: number; to?: number }]
}>()

const slider = reactiveOmit(props, 'currency', 'precision', 'locale')

function fmt(amount: number): string {
  const price: PriceType = {
    amount,
    currency: props.currency,
    precision: props.precision,
  }
  return formatPrice(price, locale.value)
}
</script>

<template>
  <FilterSlider v-bind="slider" :format-value="fmt" @change="emit('change', $event)" />
</template>

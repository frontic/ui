<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FiltersGroup } from './types'
import { computed } from 'vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@library/components/ui/accordion'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Filter, FilterList, FilterSwatch, FilterSwitch } from '@library/components/ui/filter'
import { Price } from '@library/components/ui/price'
import { Slider } from '@library/components/ui/slider'

const props = withDefaults(
  defineProps<{
    /** The card's heading. */
    title?: string
    /** Where the filters apply, such as the department and category; the result count follows it. */
    description?: string
    /** How many products the current filters leave. */
    results: number
    /** The low end of the price slider, in minor units. */
    priceMin: number
    /** The high end of the price slider, in minor units. */
    priceMax: number
    /** How far one step moves the price slider, in minor units. */
    priceStep?: number
    /** ISO 4217 code the price range is shown in. */
    currency?: string
    /** Decimal places of the currency; amounts are in its minor unit, so `2` means cents. */
    precision?: number
    /** The accordion items open at first: `price` and any group's value. */
    defaultOpen?: string[]
    /** Shown on the accordion item that holds the price slider. */
    priceLabel?: string
    /** Shown between the low and high price of the range. */
    priceToLabel?: string
    /** Shown beside the switch that hides sold-out products. */
    inStockLabel?: string
    /** Shown on the button that clears every filter. */
    clearLabel?: string
    /** Builds the result count under the heading from the number of products. */
    resultsLabel?: (count: number) => string
    /** Builds the text of the button that applies the filters from the number of products. */
    showResultsLabel?: (count: number) => string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Filters',
    priceStep: 100,
    currency: 'EUR',
    precision: 2,
    defaultOpen: () => ['price'],
    priceLabel: 'Price',
    priceToLabel: 'to',
    inStockLabel: 'In stock only',
    clearLabel: 'Clear all',
    resultsLabel: (count: number) => (count === 1 ? '1 result' : `${count} results`),
    showResultsLabel: (count: number) => (count === 1 ? 'Show 1 result' : `Show ${count} results`),
  },
)
const emit = defineEmits<{
  /** Fires when the shopper clicks the show-results button to apply the filters. */
  apply: []
  /** Fires after the shopper clears all filters, once price, options and in-stock are reset. */
  clear: []
}>()

/** The filter groups, one accordion item each, with their options' selection. */
const groups = defineModel<FiltersGroup[]>('groups', { default: () => [] })
/** The chosen price range as `[low, high]` in minor units; the full range when left out. */
const price = defineModel<number[]>('price')
/** Whether only products in stock are shown. */
const inStock = defineModel<boolean>('inStock', { default: false })

const range = computed(() => price.value ?? [props.priceMin, props.priceMax])
const selectedIn = (group: FiltersGroup) => group.options.filter((o) => o.selected).length

function toggle(groupValue: string, value: string) {
  groups.value = groups.value.map((group) =>
    group.value === groupValue ? ({ ...group, options: group.options.map((o) => (o.value === value ? { ...o, selected: !o.selected } : o)) } as FiltersGroup) : group,
  )
}

function clearAll() {
  price.value = [props.priceMin, props.priceMax]
  groups.value = groups.value.map((group) => ({ ...group, options: group.options.map((o) => ({ ...o, selected: false })) }) as FiltersGroup)
  inStock.value = false
  emit('clear')
}
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>
        <template v-if="description">{{ description }} · </template>{{ resultsLabel(results) }}
      </CardDescription>
      <CardAction>
        <Button variant="ghost" color="neutral" size="sm" @click="clearAll">{{ clearLabel }}</Button>
      </CardAction>
    </CardHeader>
    <CardContent>
      <Filter :reset="clearAll">
        <Accordion type="multiple" :default-value="defaultOpen">
          <AccordionItem value="price">
            <AccordionTrigger>{{ priceLabel }}</AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-4 pt-1">
                <div class="flex items-center justify-between">
                  <Price :price="{ amount: range[0] ?? priceMin, currency, precision }" size="sm" />
                  <span data-slot="filters-range-to" class="fui-filters-range-to">{{ priceToLabel }}</span>
                  <Price :price="{ amount: range[1] ?? priceMax, currency, precision }" size="sm" />
                </div>
                <Slider :model-value="range" :min="priceMin" :max="priceMax" :step="priceStep" @update:model-value="price = $event" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem v-for="group in groups" :key="group.value" :value="group.value">
            <AccordionTrigger>
              <span class="flex flex-1 items-center gap-2">
                {{ group.label }}
                <Badge v-if="selectedIn(group)" variant="primary" size="sm">{{ selectedIn(group) }}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <FilterSwatch v-if="group.kind === 'swatch'" :options="group.options" :aria-label="group.label" @toggle="toggle(group.value, $event)" />
              <FilterList v-else :options="group.options" :aria-label="group.label" @toggle="toggle(group.value, $event)" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <FilterSwitch :value="inStock" :label="inStockLabel" @change="inStock = $event" />
      </Filter>
    </CardContent>
    <CardFooter>
      <Button class="w-full" @click="emit('apply')">{{ showResultsLabel(results) }}</Button>
    </CardFooter>
  </Card>
</template>

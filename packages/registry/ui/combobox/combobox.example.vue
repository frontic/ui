<script setup lang="ts">
import { Field, FieldLabel } from '@library/components/ui/field'
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxViewport,
} from '.'
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

const regions = [
  {
    heading: 'Delivery in 2–3 days',
    countries: [
      { value: 'AT', label: 'Austria' },
      { value: 'BE', label: 'Belgium' },
      { value: 'DE', label: 'Germany' },
      { value: 'NL', label: 'Netherlands' },
    ],
  },
  {
    heading: 'Delivery in 4–6 days',
    countries: [
      { value: 'DK', label: 'Denmark' },
      { value: 'FR', label: 'France' },
      { value: 'IT', label: 'Italy' },
      { value: 'ES', label: 'Spain' },
      { value: 'SE', label: 'Sweden' },
      { value: 'CH', label: 'Switzerland' },
      { value: 'GB', label: 'United Kingdom' },
    ],
  },
]

const country = ref<(typeof regions)[number]['countries'][number]>()
</script>

<template>
  <Field class="w-fit max-w-full">
    <FieldLabel>Ship to</FieldLabel>
    <Combobox v-model="country" by="value" v-bind="$attrs">
      <ComboboxAnchor>
        <ComboboxTrigger class="min-w-64">
          {{ country?.label ?? 'Select your country' }}
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxList>
        <ComboboxInput placeholder="Search countries" />
        <ComboboxViewport>
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          <template v-for="(region, index) in regions" :key="region.heading">
            <ComboboxSeparator v-if="index > 0" />
            <ComboboxGroup :heading="region.heading">
              <ComboboxItem
                v-for="option in region.countries"
                :key="option.value"
                :value="option">
                {{ option.label }}
                <ComboboxItemIndicator>
                  <IconPlaceholder
                    data-icon
                    lucide="CheckIcon"
                    tabler="IconCheck"
                    hugeicons="Tick02Icon"
                    phosphor="CheckIcon"
                    remixicon="RiCheckLine" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </template>
        </ComboboxViewport>
      </ComboboxList>
    </Combobox>
  </Field>
</template>

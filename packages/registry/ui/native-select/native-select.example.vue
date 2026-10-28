<script setup lang="ts">
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '.'

defineOptions({ inheritAttrs: false })

const regions = [
  {
    label: 'EU',
    countries: [
      { value: 'de', label: 'Germany' },
      { value: 'at', label: 'Austria' },
      { value: 'nl', label: 'Netherlands' },
    ],
  },
  {
    label: 'Outside the EU',
    countries: [{ value: 'ch', label: 'Switzerland' }],
  },
]
</script>

<template>
  <Field class="w-full max-w-sm">
    <FieldLabel>Country</FieldLabel>
    <NativeSelect autocomplete="country" class="w-full" v-bind="$attrs">
      <NativeSelectOption value="" disabled
        >Select a country</NativeSelectOption
      >
      <NativeSelectOptGroup
        v-for="region in regions"
        :key="region.label"
        :label="region.label">
        <NativeSelectOption
          v-for="country in region.countries"
          :key="country.value"
          :value="country.value"
          >{{ country.label }}</NativeSelectOption
        >
      </NativeSelectOptGroup>
    </NativeSelect>
    <FieldDescription>We ship within the EU and Switzerland.</FieldDescription>
  </Field>
</template>

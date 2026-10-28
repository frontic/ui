<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Field, FieldLabel } from '@library/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '.'

defineOptions({ inheritAttrs: false })

const sizes = [
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL', soldOut: true },
]
const inStock = sizes.filter((size) => !size.soldOut)
const soldOut = sizes.filter((size) => size.soldOut)
</script>

<template>
  <Field>
    <FieldLabel>Jacket size</FieldLabel>
    <Select v-bind="$attrs">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="Select a size" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>In stock</SelectLabel>
          <SelectItem
            v-for="size in inStock"
            :key="size.value"
            :value="size.value"
            >{{ size.label }}</SelectItem
          >
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Sold out</SelectLabel>
          <SelectItem
            v-for="size in soldOut"
            :key="size.value"
            :value="size.value"
            disabled
            >{{ size.label }}</SelectItem
          >
        </SelectGroup>
      </SelectContent>
    </Select>
  </Field>
</template>

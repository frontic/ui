<script setup lang="ts">
import { useId } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@library/components/ui/select'
import { Label } from '.'

defineOptions({ inheritAttrs: false })

const id = useId()
const sorts = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]
</script>

<template>
  <div class="flex items-center gap-3">
    <Label :for="id" v-bind="$attrs">Sort by</Label>
    <Select default-value="relevance">
      <SelectTrigger :id="id" class="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="sort in sorts"
          :key="sort.value"
          :value="sort.value"
          >{{ sort.label }}</SelectItem
        >
      </SelectContent>
    </Select>
  </div>
</template>

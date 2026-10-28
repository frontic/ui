<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ref } from 'vue'
import { TagGroup, TagGroupItem, TagGroupItemDelete, TagGroupItemText } from '.'

defineOptions({ inheritAttrs: false })

const filters = ref([
  'Jackets',
  'Northridge',
  'Size M',
  'Under €150',
  'Waterproof',
])

function remove(values: unknown[]) {
  filters.value = filters.value.filter((filter) => !values.includes(filter))
}
</script>

<template>
  <TagGroup aria-label="Active filters" @remove="remove" v-bind="$attrs">
    <TagGroupItem v-for="filter in filters" :key="filter" :value="filter">
      <TagGroupItemText>{{ filter }}</TagGroupItemText>
      <TagGroupItemDelete />
    </TagGroupItem>
  </TagGroup>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '.'

defineOptions({ inheritAttrs: false })

const query = ref('hardshell')
const input = useTemplateRef<{ $el: HTMLInputElement }>('input')

function clear() {
  query.value = ''
  input.value?.$el.focus()
}
</script>

<template>
  <InputGroup class="max-w-sm" v-bind="$attrs">
    <InputGroupInput
      ref="input"
      v-model="query"
      placeholder="Search products"
      aria-label="Search products" />
    <InputGroupAddon>
      <IconPlaceholder
        data-icon
        lucide="SearchIcon"
        tabler="IconSearch"
        hugeicons="SearchIcon"
        phosphor="MagnifyingGlassIcon"
        remixicon="RiSearchLine" />
    </InputGroupAddon>
    <InputGroupAddon v-if="query" align="inline-end">
      <InputGroupButton size="icon-xs" aria-label="Clear search" @click="clear">
        <IconPlaceholder
          data-icon
          lucide="XIcon"
          tabler="IconX"
          hugeicons="Cancel01Icon"
          phosphor="XIcon"
          remixicon="RiCloseLine" />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</template>

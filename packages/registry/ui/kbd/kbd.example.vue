<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@library/components/ui/input-group'
import { Kbd, KbdGroup } from '.'

defineOptions({ inheritAttrs: false })

const input = useTemplateRef<{ $el: HTMLInputElement }>('input')

function onKeydown(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey))
    return
  event.preventDefault()
  input.value?.$el.focus()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <InputGroup class="max-w-sm">
    <InputGroupInput
      ref="input"
      placeholder="Search products"
      aria-label="Search products"
      aria-keyshortcuts="Meta+K Control+K" />
    <InputGroupAddon>
      <IconPlaceholder
        data-icon
        lucide="SearchIcon"
        tabler="IconSearch"
        hugeicons="SearchIcon"
        phosphor="MagnifyingGlassIcon"
        remixicon="RiSearchLine" />
    </InputGroupAddon>
    <InputGroupAddon align="inline-end">
      <KbdGroup>
        <Kbd v-bind="$attrs">⌘</Kbd>
        <Kbd v-bind="$attrs">K</Kbd>
      </KbdGroup>
    </InputGroupAddon>
  </InputGroup>
</template>

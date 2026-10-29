<script lang="ts">
/** Opens and closes a filter group, showing its label and count of active options. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** Shown on the trigger, e.g. `Brand` or `Size`. */
  label: string
  /** How many options in the group are active; shown as a count when above zero. */
  activeCount?: number
}>()
</script>

<template>
  <Button data-slot="filter-trigger" variant="outline" color="neutral" :class="['fui-filter-trigger', props.class]">
    <span data-slot="filter-trigger-label" class="flex-1 text-start">{{ label }}</span>
    <span v-if="activeCount" data-slot="filter-trigger-count" class="fui-filter-trigger-count ms-auto inline-flex shrink-0 items-center justify-center">
      {{ activeCount }}
    </span>
    <IconPlaceholder
      lucide="ChevronDownIcon"
      tabler="IconChevronDown"
      hugeicons="ArrowDown01Icon"
      phosphor="CaretDownIcon"
      remixicon="RiArrowDownSLine"
      data-icon
      class="transition-transform duration-200 group-aria-expanded/button:rotate-180"
    />
  </Button>
</template>

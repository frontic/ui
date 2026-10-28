<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { RadioGroupIndicator } from 'reka-ui'
import { inject } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { radioAccordionItem } from './keys'

const item = inject(radioAccordionItem)
</script>

<template>
  <span data-slot="radio-accordion-indicator" :data-state="item?.checked.value ? 'checked' : 'unchecked'" class="fui-radio-accordion-indicator aspect-square">
    <RadioGroupIndicator class="flex items-center justify-center">
      <IconPlaceholder data-icon lucide="CircleIcon" tabler="IconCircle" hugeicons="CircleIcon" phosphor="CircleIcon" remixicon="RiCircleLine" class="fill-current" />
    </RadioGroupIndicator>
  </span>
</template>

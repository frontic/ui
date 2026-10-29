<script lang="ts">
/** Separates two steps of the breadcrumb. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" :class="['fui-breadcrumb-separator', props.class]">
    <slot>
      <IconPlaceholder lucide="ChevronRightIcon" tabler="IconChevronRight" hugeicons="ArrowRight01Icon" phosphor="CaretRightIcon" remixicon="RiArrowRightSLine" class="rtl:-scale-x-100" data-icon />
    </slot>
  </li>
</template>

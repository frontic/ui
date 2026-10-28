<script lang="ts">
/** Stands in for breadcrumb steps that are hidden to save space. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Screen-reader text for the hidden steps. */
    label?: string
  }>(),
  { label: 'More' },
)
</script>

<template>
  <span data-slot="breadcrumb-ellipsis" role="presentation" aria-hidden="true" :class="['fui-breadcrumb-ellipsis', props.class]">
    <slot>
      <IconPlaceholder lucide="MoreHorizontalIcon" tabler="IconDots" hugeicons="MoreHorizontalCircle01Icon" phosphor="DotsThreeIcon" remixicon="RiMoreLine" data-icon />
    </slot>
    <span class="sr-only">{{ props.label }}</span>
  </span>
</template>

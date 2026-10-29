<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Read by screen readers while the spinner shows. */
    label?: string
  }>(),
  { label: 'Loading' },
)
</script>

<template>
  <IconPlaceholder
    lucide="Loader2Icon"
    tabler="IconLoader2"
    hugeicons="Loading03Icon"
    phosphor="CircleNotchIcon"
    remixicon="RiLoader4Line"
    role="status"
    :aria-label="props.label"
    :class="['fui-spinner animate-spin', props.class]"
  />
</template>

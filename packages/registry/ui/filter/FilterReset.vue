<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the user clear all filters at once. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown on the reset button; the default slot replaces it. */
    label?: string
  }>(),
  { label: 'Reset' },
)

const emit = defineEmits<{
  /** Fires when the user clicks the reset button, after the surrounding filter's own reset runs. */
  reset: []
}>()

const injectedReset = inject<(() => void) | undefined>('filter-reset', undefined)

function handleReset() {
  if (injectedReset) {
    injectedReset()
  }
  emit('reset')
}
</script>

<template>
  <div data-slot="filter-reset" :class="['fui-filter-reset-root', props.class]">
    <Button variant="outline" color="neutral" size="sm" class="fui-filter-reset" @click="handleReset">
      <IconPlaceholder lucide="RotateCcwIcon" tabler="IconRotate" hugeicons="RotateCcwIcon" phosphor="ArrowCounterClockwiseIcon" remixicon="RiArrowGoBackLine" data-icon class="me-3" />
      <slot>{{ props.label }}</slot>
    </Button>
  </div>
</template>

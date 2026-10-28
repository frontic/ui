<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Separates fields of a form, optionally with a short text in between. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Separator } from '@library/components/ui/separator'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div data-slot="field-separator" :data-content="!!$slots.default" :class="['fui-field-separator relative', props.class]">
    <Separator class="absolute inset-0 top-1/2" />
    <span v-if="$slots.default" class="fui-field-separator-content relative mx-auto block w-fit" data-slot="field-separator-content">
      <slot />
    </span>
  </div>
</template>

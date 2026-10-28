<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows a placeholder in place of an image that failed to load. */
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
  <span data-slot="image-fallback" :class="['fui-image-fallback', props.class]">
    <slot>
      <IconPlaceholder lucide="ImageOffIcon" tabler="IconPhotoOff" hugeicons="ImageNotFound01Icon" phosphor="ImageBrokenIcon" remixicon="RiImageLine" data-icon />
    </slot>
  </span>
</template>

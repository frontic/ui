<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Marks the element that shows the tooltip on hover or focus. */
export default {}
</script>

<script setup lang="ts">
import type { TooltipTriggerProps } from 'reka-ui'
import { TooltipTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<TooltipTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <TooltipTrigger data-slot="tooltip-trigger" v-bind="forwarded">
    <slot />
  </TooltipTrigger>
</template>

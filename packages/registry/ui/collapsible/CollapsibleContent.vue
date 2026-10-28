<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds what its collapsible shows while open. */
export default {}
</script>

<script setup lang="ts">
import type { CollapsibleContentProps } from 'reka-ui'
import { CollapsibleContent, useForwardProps } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <CollapsibleContent data-slot="collapsible-content" v-bind="forwarded" class="fui-collapsible-content data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
    <slot />
  </CollapsibleContent>
</template>

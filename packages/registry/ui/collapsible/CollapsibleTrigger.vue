<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Opens and closes the content of its collapsible. */
export default {}
</script>

<script setup lang="ts">
import type { CollapsibleTriggerProps } from 'reka-ui'
import { CollapsibleTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<CollapsibleTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <CollapsibleTrigger data-slot="collapsible-trigger" v-bind="forwarded" class="outline-none focus-visible:fui-focus-ring">
    <slot />
  </CollapsibleTrigger>
</template>

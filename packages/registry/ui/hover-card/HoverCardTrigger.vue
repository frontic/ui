<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Opens the hover card when the user hovers over it. */
export default {}
</script>

<script setup lang="ts">
import type { HoverCardTriggerProps } from 'reka-ui'
import { HoverCardTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<HoverCardTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <HoverCardTrigger data-slot="hover-card-trigger" v-bind="forwarded">
    <slot />
  </HoverCardTrigger>
</template>

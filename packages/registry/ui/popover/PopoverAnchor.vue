<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Sets the element the popover content is positioned against. */
export default {}
</script>

<script setup lang="ts">
import type { PopoverAnchorProps } from 'reka-ui'
import { PopoverAnchor, useForwardProps } from 'reka-ui'

const props = defineProps<PopoverAnchorProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <PopoverAnchor data-slot="popover-anchor" v-bind="forwarded">
    <slot />
  </PopoverAnchor>
</template>

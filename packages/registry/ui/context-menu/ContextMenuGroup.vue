<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups related items in the context menu. */
export default {}
</script>

<script setup lang="ts">
import type { ContextMenuGroupProps } from 'reka-ui'
import { ContextMenuGroup, useForwardProps } from 'reka-ui'

const props = defineProps<ContextMenuGroupProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <ContextMenuGroup data-slot="context-menu-group" v-bind="forwarded">
    <slot />
  </ContextMenuGroup>
</template>

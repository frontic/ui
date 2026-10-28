<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups related entries of the dropdown menu. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuGroupProps } from 'reka-ui'
import { DropdownMenuGroup, useForwardProps } from 'reka-ui'

const props = defineProps<DropdownMenuGroupProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DropdownMenuGroup data-slot="dropdown-menu-group" v-bind="forwarded">
    <slot />
  </DropdownMenuGroup>
</template>

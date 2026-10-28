<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds the text of an option, which the select shows once chosen. */
export default {}
</script>

<script setup lang="ts">
import type { SelectItemTextProps } from 'reka-ui'
import { SelectItemText, useForwardProps } from 'reka-ui'

const props = defineProps<SelectItemTextProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectItemText data-slot="select-item-text" v-bind="forwarded">
    <slot />
  </SelectItemText>
</template>

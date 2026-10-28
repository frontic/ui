<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups radio items so the user can pick exactly one. */
export default {}
</script>

<script setup lang="ts">
import type { ContextMenuRadioGroupEmits, ContextMenuRadioGroupProps } from 'reka-ui'
import { ContextMenuRadioGroup, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<ContextMenuRadioGroupProps>()
const emits = defineEmits<ContextMenuRadioGroupEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ContextMenuRadioGroup data-slot="context-menu-radio-group" v-bind="forwarded">
    <slot />
  </ContextMenuRadioGroup>
</template>

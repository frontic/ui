<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups a submenu trigger with the submenu it opens. */
export default {}
</script>

<script setup lang="ts">
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'reka-ui'
import { ContextMenuSub, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<ContextMenuSubProps>()
const emits = defineEmits<ContextMenuSubEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ContextMenuSub data-slot="context-menu-sub" v-bind="forwarded">
    <slot />
  </ContextMenuSub>
</template>

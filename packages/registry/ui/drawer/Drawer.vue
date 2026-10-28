<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the drawer. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerRootEmits, DrawerRootProps } from 'reka-ui'
import { DrawerRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DrawerRootProps>()

const emits = defineEmits<DrawerRootEmits>()

defineSlots<{
  /** Holds the drawer's trigger and content; gets whether it is open and a function that closes it. */
  default?: (props: { open: boolean; close: () => void }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerRoot v-slot="slotProps" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DrawerRoot>
</template>

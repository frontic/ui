<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Closes the drawer. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerCloseProps } from 'reka-ui'
import { DrawerClose, useForwardProps } from 'reka-ui'

const props = defineProps<DrawerCloseProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DrawerClose data-slot="drawer-close" v-bind="forwarded">
    <slot />
  </DrawerClose>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Opens the drawer. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerTriggerProps } from 'reka-ui'
import { DrawerTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<DrawerTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DrawerTrigger data-slot="drawer-trigger" v-bind="forwarded">
    <slot />
  </DrawerTrigger>
</template>

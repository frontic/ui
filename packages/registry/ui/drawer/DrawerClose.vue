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

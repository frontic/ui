<script lang="ts">
/** Places the menu content above the rest of the page. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuPortalProps } from 'reka-ui'
import { DropdownMenuPortal, useForwardProps } from 'reka-ui'

const props = defineProps<DropdownMenuPortalProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DropdownMenuPortal v-bind="forwarded">
    <slot />
  </DropdownMenuPortal>
</template>

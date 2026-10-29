<script setup lang="ts">
import type { ContextMenuPortalProps } from 'reka-ui'
import { ContextMenuPortal, useForwardProps } from 'reka-ui'

const props = defineProps<ContextMenuPortalProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <ContextMenuPortal data-slot="context-menu-portal" v-bind="forwarded">
    <slot />
  </ContextMenuPortal>
</template>

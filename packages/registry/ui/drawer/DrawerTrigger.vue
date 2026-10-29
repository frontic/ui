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

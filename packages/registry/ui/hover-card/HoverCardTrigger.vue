<script setup lang="ts">
import type { HoverCardTriggerProps } from 'reka-ui'
import { HoverCardTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<HoverCardTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <HoverCardTrigger data-slot="hover-card-trigger" v-bind="forwarded">
    <slot />
  </HoverCardTrigger>
</template>

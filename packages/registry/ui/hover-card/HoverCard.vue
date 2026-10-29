<script lang="ts">
/** Groups all parts of the hover card. */
export default {}
</script>

<script setup lang="ts">
import type { HoverCardRootEmits, HoverCardRootProps } from 'reka-ui'
import { HoverCardRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<HoverCardRootProps>()
const emits = defineEmits<HoverCardRootEmits>()

defineSlots<{
  /** Holds the hover card's trigger and content; gets whether the card is open. */
  default?: (props: { open: boolean }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <HoverCardRoot v-slot="slotProps" data-slot="hover-card" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </HoverCardRoot>
</template>

<script lang="ts">
/** Opens the search overlay; focus returns to it when the overlay closes, also after a click that never focused it. */
export default {}
</script>

<script setup lang="ts">
import type { DialogTriggerProps } from 'reka-ui'
import { DialogTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<DialogTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DialogTrigger data-slot="search-overlay-trigger" v-bind="forwarded">
    <slot />
  </DialogTrigger>
</template>

<script setup lang="ts">
import type { SelectItemTextProps } from 'reka-ui'
import { SelectItemText, useForwardProps } from 'reka-ui'

const props = defineProps<SelectItemTextProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectItemText data-slot="select-item-text" v-bind="forwarded">
    <slot />
  </SelectItemText>
</template>

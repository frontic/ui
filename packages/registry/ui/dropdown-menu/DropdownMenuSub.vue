<script setup lang="ts">
import type { DropdownMenuSubEmits, DropdownMenuSubProps } from 'reka-ui'
import { DropdownMenuSub, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DropdownMenuSubProps>()
const emits = defineEmits<DropdownMenuSubEmits>()

defineSlots<{
  /** Holds the submenu's trigger and content; gets whether the submenu is open. */
  default?: (props: { open: boolean }) => unknown
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuSub v-slot="slotProps" data-slot="dropdown-menu-sub" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DropdownMenuSub>
</template>

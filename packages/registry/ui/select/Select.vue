<script lang="ts">
/** Groups all parts of the select. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, SelectRootEmits, SelectRootProps } from 'reka-ui'
import { SelectRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

defineSlots<{
  /** Holds the select's trigger and content; gets the selected value and whether the list is open. */
  default?: (props: { modelValue: AcceptableValue | AcceptableValue[] | undefined; open: boolean }) => unknown
}>()
</script>

<template>
  <SelectRoot v-slot="slotProps" data-slot="select" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </SelectRoot>
</template>

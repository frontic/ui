<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows the chosen option, or a placeholder when nothing is chosen. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, SelectValueProps } from 'reka-ui'
import { SelectValue, useForwardProps } from 'reka-ui'

const props = defineProps<SelectValueProps>()

defineSlots<{
  /** Replaces the shown value; gets the labels of the chosen options and the selected value. */
  default?: (props: { selectedLabel: string[]; modelValue: AcceptableValue | AcceptableValue[] | undefined }) => unknown
}>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectValue v-slot="{ selectedLabel, modelValue }" data-slot="select-value" class="fui-select-value line-clamp-1 flex" v-bind="forwarded">
    <slot :selected-label="selectedLabel" :model-value="modelValue">
      <template v-if="selectedLabel.length">{{ selectedLabel.join(', ') }}</template>
      <span v-else class="fui-select-value-placeholder">{{ props.placeholder }}</span>
    </slot>
  </SelectValue>
</template>

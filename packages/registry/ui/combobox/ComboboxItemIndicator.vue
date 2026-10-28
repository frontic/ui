<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Marks an option as selected in the combobox list. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxItemIndicatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxItemIndicator, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxItemIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxItemIndicator data-slot="combobox-item-indicator" v-bind="forwarded" :class="['fui-combobox-item-indicator pointer-events-none absolute inset-e-2', props.class]">
    <slot />
  </ComboboxItemIndicator>
</template>

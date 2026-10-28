<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Separates groups of suggestions in the list. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteSeparator, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteSeparator data-slot="autocomplete-separator" v-bind="forwarded" :class="['fui-autocomplete-separator', props.class]" />
</template>

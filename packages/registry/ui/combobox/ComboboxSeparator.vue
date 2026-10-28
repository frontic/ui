<script lang="ts">
/** Separates groups of options in the combobox list; hidden while a search filters the list. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxSeparator, injectComboboxRootContext, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

// Reka hides a group the search empties but not the separator beside it.
const root = injectComboboxRootContext()
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxSeparator v-show="!root.filterSearch.value" data-slot="combobox-separator" v-bind="forwarded" :class="['fui-combobox-separator', props.class]">
    <slot />
  </ComboboxSeparator>
</template>

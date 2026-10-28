<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows a message when no suggestion matches the text. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxEmptyProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteEmpty, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteEmpty data-slot="autocomplete-empty" v-bind="forwarded" :class="['fui-autocomplete-empty', props.class]">
    <slot />
  </AutocompleteEmpty>
</template>

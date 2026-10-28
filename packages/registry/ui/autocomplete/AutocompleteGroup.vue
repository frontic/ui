<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups related suggestions under an optional heading. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteGroup, AutocompleteLabel, useForwardProps } from 'reka-ui'

const props = defineProps<
  ComboboxGroupProps & {
    class?: HTMLAttributes['class']
    /** Text shown above the group's suggestions. */
    heading?: string
  }
>()

const delegatedProps = reactiveOmit(props, 'class', 'heading')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteGroup data-slot="autocomplete-group" v-bind="forwarded" :class="['overflow-hidden', props.class]">
    <AutocompleteLabel v-if="heading" class="fui-autocomplete-label">
      {{ heading }}
    </AutocompleteLabel>
    <slot />
  </AutocompleteGroup>
</template>

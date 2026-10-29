<script lang="ts">
/** Frames the input and its buttons as one field, and marks where the suggestion list attaches. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxAnchorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteAnchor, useForwardProps } from 'reka-ui'
import { InputGroup } from '@library/components/ui/input-group'

const props = defineProps<ComboboxAnchorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteAnchor as-child data-slot="autocomplete-anchor" v-bind="forwarded">
    <InputGroup :class="props.class">
      <slot />
    </InputGroup>
  </AutocompleteAnchor>
</template>

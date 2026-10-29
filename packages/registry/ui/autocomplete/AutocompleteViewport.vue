<script setup lang="ts">
import type { ComboboxViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteViewport, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteViewport data-slot="autocomplete-viewport" v-bind="forwarded" :class="['fui-autocomplete-viewport max-h-63 scroll-py-1.5 overflow-y-auto', props.class]">
    <slot />
  </AutocompleteViewport>
</template>

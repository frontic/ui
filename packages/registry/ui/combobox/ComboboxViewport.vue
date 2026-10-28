<script lang="ts">
/** Scrolls the options when the combobox list is longer than the space available. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxViewport, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxViewport data-slot="combobox-viewport" v-bind="forwarded" :class="['fui-combobox-viewport max-h-63 scroll-py-1.5 overflow-y-auto', props.class]">
    <slot />
  </ComboboxViewport>
</template>

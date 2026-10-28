<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Keeps its content at a fixed width-to-height ratio. */
export default {}
</script>

<script setup lang="ts">
import type { AspectRatioProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AspectRatio, useForwardProps } from 'reka-ui'

const props = defineProps<AspectRatioProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  /** Holds the content kept at the ratio; gets the ratio. */
  default?: (props: { aspect: number }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AspectRatio v-slot="slotProps" data-slot="aspect-ratio" v-bind="forwarded" :class="['fui-aspect-ratio overflow-hidden', props.class]">
    <slot v-bind="slotProps" />
  </AspectRatio>
</template>

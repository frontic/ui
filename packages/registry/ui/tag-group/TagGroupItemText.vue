<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the text of one tag. */
export default {}
</script>

<script setup lang="ts">
import type { TagGroupItemTextProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagGroupItemText, useForwardProps } from 'reka-ui'

const props = withDefaults(defineProps<TagGroupItemTextProps & { class?: HTMLAttributes['class'] }>(), { as: 'span' })

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TagGroupItemText v-bind="forwardedProps" :class="['truncate', props.class]">
    <slot />
  </TagGroupItemText>
</template>

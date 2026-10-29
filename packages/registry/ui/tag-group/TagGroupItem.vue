<script lang="ts">
/** One tag: its text and, when removable, a delete button. */
export default {}
</script>

<script setup lang="ts">
import type { TagGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagGroupItem, useForwardProps } from 'reka-ui'

const props = defineProps<TagGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

defineSlots<{
  /** Holds the text and delete button; gets whether the tag is `selected` and `disabled`. */
  default?: (props: { selected: boolean; disabled: boolean }) => unknown
}>()
</script>

<template>
  <TagGroupItem
    v-slot="slotProps"
    v-bind="forwardedProps"
    :class="['fui-tag-group-item whitespace-nowrap outline-none select-none transition-colors focus-visible:fui-focus-ring data-disabled:pointer-events-none data-disabled:fui-disabled', props.class]"
  >
    <slot v-bind="slotProps" />
  </TagGroupItem>
</template>

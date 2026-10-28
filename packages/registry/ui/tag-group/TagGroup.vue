<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups tags the user moves through with the arrow keys, and can select or remove. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, TagGroupRootEmits, TagGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, getCurrentInstance } from 'vue'

const props = defineProps<TagGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TagGroupRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the tags; gets the selected value as `modelValue`. */
  default?: (props: { modelValue: AcceptableValue | AcceptableValue[] | undefined }) => unknown
}>()

// Reka lets tags be removed only when its root has a remove listener, so pass one on only when this group has one.
const instance = getCurrentInstance()
const bound = computed(() => {
  if (instance?.vnode.props?.onRemove) return forwarded.value
  const { onRemove: _, ...rest } = forwarded.value
  return rest
})
</script>

<template>
  <TagGroupRoot v-slot="slotProps" v-bind="bound" :class="['fui-tag-group outline-none', props.class]">
    <slot v-bind="slotProps" />
  </TagGroupRoot>
</template>

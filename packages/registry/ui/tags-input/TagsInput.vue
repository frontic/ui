<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the tags input, where the user enters several short values. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableInputValue, TagsInputRootEmits, TagsInputRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagsInputRoot, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { useFieldControl } from '@library/composables/use-field-control'

const props = defineProps<TagsInputRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TagsInputRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the tags and the input; gets the current tags as `modelValue`. */
  default?: (props: { modelValue: AcceptableInputValue[] }) => unknown
}>()

// Delete once Reka's TagsInput reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: (root) => root?.querySelector<HTMLElement>('input:not([data-hidden])'),
  id: () => props.id,
  aria: 'none',
})
</script>

<template>
  <TagsInputRoot ref="root" v-slot="slotProps" v-bind="joined" @update:model-value="report" :class="['fui-tags-input outline-none transition', props.class]">
    <slot v-bind="slotProps" />
  </TagsInputRoot>
</template>

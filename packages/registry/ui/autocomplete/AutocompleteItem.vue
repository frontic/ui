<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteItem, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ComboboxItemEmits>()

defineSlots<{
  /** Holds the suggestion's content; gets whether it is the selected one. */
  default?: (props: { selected: boolean }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <AutocompleteItem
    v-slot="slotProps"
    data-slot="autocomplete-item"
    v-bind="forwarded"
    :class="[
      'fui-autocomplete-item relative cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
      props.class,
    ]"
  >
    <slot v-bind="slotProps" />
  </AutocompleteItem>
</template>

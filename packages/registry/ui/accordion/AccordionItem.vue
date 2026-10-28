<script lang="ts">
/** Groups a trigger with the content it opens and closes. */
export default {}
</script>

<script setup lang="ts">
import type { AccordionItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionItem, useForwardProps } from 'reka-ui'

const props = defineProps<AccordionItemProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  /** Holds the item's trigger and content; gets whether the item is open. */
  default?: (props: { open: boolean }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <AccordionItem v-slot="slotProps" data-slot="accordion-item" v-bind="forwardedProps" :class="['fui-accordion-item last:border-b-0', props.class]">
    <slot v-bind="slotProps" />
  </AccordionItem>
</template>

<script setup lang="ts">
import type { AcceptableValue, AccordionRootEmits, AccordionRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<AccordionRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<AccordionRootEmits>()

defineSlots<{
  /** Holds the accordion's items; gets the value of the open item or items. */
  default?: (props: { modelValue: AcceptableValue | AcceptableValue[] | undefined }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <AccordionRoot v-slot="slotProps" data-slot="accordion" v-bind="forwarded" :class="['fui-accordion', props.class]">
    <slot v-bind="slotProps" />
  </AccordionRoot>
</template>

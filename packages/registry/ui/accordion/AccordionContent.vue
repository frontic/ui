<script lang="ts">
/** Holds what its item shows while open. */
export default {}
</script>

<script setup lang="ts">
import type { AccordionContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionContent, useForwardProps } from 'reka-ui'

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AccordionContent data-slot="accordion-content" v-bind="forwarded" class="data-open:animate-accordion-down data-closed:animate-accordion-up overflow-hidden">
    <div :class="['fui-accordion-body [&_p:not(:last-child)]:mb-4', props.class]">
      <slot />
    </div>
  </AccordionContent>
</template>

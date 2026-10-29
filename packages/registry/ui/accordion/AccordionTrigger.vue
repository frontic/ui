<script lang="ts">
/** Opens and closes the content of its item. */
export default {}
</script>

<script setup lang="ts">
import type { AccordionTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionHeader, AccordionTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  default?: () => unknown
  /** Replaces the plus icon, which turns into a cross while the item is open. */
  icon?: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="forwarded"
      :class="[
        'fui-accordion-trigger group/accordion-trigger relative transition-all outline-none focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled **:data-icon:ms-auto',
        props.class,
      ]"
    >
      <slot />
      <slot name="icon">
        <IconPlaceholder
          lucide="PlusIcon"
          tabler="IconPlus"
          data-slot="accordion-trigger-icon"
          hugeicons="PlusSignIcon"
          phosphor="PlusIcon"
          remixicon="RiAddLine"
          data-icon
          class="pointer-events-none shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none group-aria-expanded/accordion-trigger:rotate-45"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>

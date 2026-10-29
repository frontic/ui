<script lang="ts">
/** Scrolls the options up when the list is longer than the view. */
export default {}
</script>

<script setup lang="ts">
import type { SelectScrollUpButtonProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectScrollUpButton, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectScrollUpButton data-slot="select-scroll-up-button" v-bind="forwardedProps" :class="['fui-select-scroll-button z-10 cursor-default', props.class]">
    <slot>
      <IconPlaceholder lucide="ChevronUpIcon" tabler="IconChevronUp" hugeicons="ArrowUp01Icon" phosphor="CaretUpIcon" remixicon="RiArrowUpSLine" data-icon />
    </slot>
  </SelectScrollUpButton>
</template>

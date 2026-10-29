<script lang="ts">
/** Scrolls the options down when the list is longer than the view. */
export default {}
</script>

<script setup lang="ts">
import type { SelectScrollDownButtonProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectScrollDownButton, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<SelectScrollDownButtonProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectScrollDownButton data-slot="select-scroll-down-button" v-bind="forwardedProps" :class="['fui-select-scroll-button z-10 cursor-default', props.class]">
    <slot>
      <IconPlaceholder lucide="ChevronDownIcon" tabler="IconChevronDown" hugeicons="ArrowDown01Icon" phosphor="CaretDownIcon" remixicon="RiArrowDownSLine" data-icon />
    </slot>
  </SelectScrollDownButton>
</template>

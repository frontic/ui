<script lang="ts">
/** Opens a submenu from an item of the dropdown menu. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuSubTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuSubTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<
  DropdownMenuSubTriggerProps & {
    class?: HTMLAttributes['class']
    /** Indents the trigger to line up with items that show a check or icon. */
    inset?: boolean
  }
>()

const delegatedProps = reactiveOmit(props, 'class', 'inset')
const forwardedProps = useForwardProps(delegatedProps)

const subTrigger = cva('fui-dropdown-menu-sub-trigger cursor-default outline-hidden select-none **:data-icon:pointer-events-none **:data-icon:shrink-0', {
  variants: { pad: { default: 'fui-dropdown-menu-sub-trigger-default', inset: 'fui-dropdown-menu-sub-trigger-inset' } },
  defaultVariants: { pad: 'default' },
})
</script>

<template>
  <DropdownMenuSubTrigger
    data-slot="dropdown-menu-sub-trigger"
    :data-inset="inset ? '' : undefined"
    v-bind="forwardedProps"
    :class="[subTrigger({ pad: props.inset ? 'inset' : 'default' }), props.class]"
  >
    <slot />
    <IconPlaceholder
      lucide="ChevronRightIcon"
      tabler="IconChevronRight"
      hugeicons="ArrowRight01Icon"
      phosphor="CaretRightIcon"
      remixicon="RiArrowRightSLine"
      class="ms-auto rtl:rotate-180"
      data-icon
    />
  </DropdownMenuSubTrigger>
</template>

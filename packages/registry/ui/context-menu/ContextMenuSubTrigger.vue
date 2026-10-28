<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Opens a submenu from an item of the context menu. */
export default {}
</script>

<script setup lang="ts">
import type { ContextMenuSubTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuSubTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<
  ContextMenuSubTriggerProps & {
    class?: HTMLAttributes['class']
    /** Indents the trigger to line up with items that show a check or icon. */
    inset?: boolean
  }
>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const subTrigger = cva('fui-context-menu-sub-trigger cursor-default outline-hidden select-none **:data-icon:pointer-events-none **:data-icon:shrink-0', {
  variants: { pad: { default: 'fui-context-menu-sub-trigger-default', inset: 'fui-context-menu-sub-trigger-inset' } },
  defaultVariants: { pad: 'default' },
})
</script>

<template>
  <ContextMenuSubTrigger
    data-slot="context-menu-sub-trigger"
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
  </ContextMenuSubTrigger>
</template>

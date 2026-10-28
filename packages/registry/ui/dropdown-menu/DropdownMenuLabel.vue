<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Labels a group of entries in the dropdown menu. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { DropdownMenuLabel, useForwardProps } from 'reka-ui'

const props = defineProps<
  DropdownMenuLabelProps & {
    class?: HTMLAttributes['class']
    /** Indents the label to line up with items that show a check or icon. */
    inset?: boolean
  }
>()

const delegatedProps = reactiveOmit(props, 'class', 'inset')
const forwardedProps = useForwardProps(delegatedProps)

const label = cva('fui-dropdown-menu-label', {
  variants: { pad: { default: 'fui-dropdown-menu-label-default', inset: 'fui-dropdown-menu-label-inset' } },
  defaultVariants: { pad: 'default' },
})
</script>

<template>
  <DropdownMenuLabel data-slot="dropdown-menu-label" :data-inset="inset ? '' : undefined" v-bind="forwardedProps" :class="[label({ pad: props.inset ? 'inset' : 'default' }), props.class]">
    <slot />
  </DropdownMenuLabel>
</template>

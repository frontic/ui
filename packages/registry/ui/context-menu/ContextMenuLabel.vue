<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { ContextMenuLabel, useForwardProps } from 'reka-ui'

const props = defineProps<
  ContextMenuLabelProps & {
    class?: HTMLAttributes['class']
    /** Indents the label to line up with items that show a check or icon. */
    inset?: boolean
  }
>()

const delegatedProps = reactiveOmit(props, 'class')

const label = cva('fui-context-menu-label', {
  variants: { pad: { default: 'fui-context-menu-label-default', inset: 'fui-context-menu-label-inset' } },
  defaultVariants: { pad: 'default' },
})
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ContextMenuLabel data-slot="context-menu-label" :data-inset="inset ? '' : undefined" v-bind="forwarded" :class="[label({ pad: props.inset ? 'inset' : 'default' }), props.class]">
    <slot />
  </ContextMenuLabel>
</template>

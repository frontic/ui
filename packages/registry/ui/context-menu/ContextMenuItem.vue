<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuItem, useForwardPropsEmits } from 'reka-ui'

const props = withDefaults(
  defineProps<
    ContextMenuItemProps & {
      class?: HTMLAttributes['class']
      /** Indents the item to line up with items that show a check or icon. */
      inset?: boolean
      /** The item's intent: destructive marks an action that deletes or cannot be undone, such as removing an address. */
      color?: 'neutral' | 'destructive'
    }
  >(),
  {
    color: 'neutral',
  },
)
const emits = defineEmits<ContextMenuItemEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'inset', 'color')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const item = cva(
  'fui-context-menu-item group/context-menu-item relative cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
  {
    variants: {
      color: { destructive: 'fui-context-menu-item-destructive' },
      pad: { default: 'fui-context-menu-item-default', inset: 'fui-context-menu-item-inset', indicator: 'fui-context-menu-item-indicator' },
    },
    defaultVariants: { pad: 'default' },
  },
)
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-color="color"
    v-bind="forwarded"
    :class="[item({ color: props.color === 'destructive' ? 'destructive' : undefined, pad: props.inset ? 'inset' : 'default' }), props.class]"
  >
    <slot />
  </ContextMenuItem>
</template>

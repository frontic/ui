<script setup lang="ts">
import type { ContextMenuCheckboxItemEmits, ContextMenuCheckboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuCheckboxItem, ContextMenuItemIndicator, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<ContextMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuCheckboxItemEmits>()

defineSlots<{
  /** Replaces the check icon shown while the option is on. */
  'indicator-icon'?: () => unknown
  default?: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuCheckboxItem
    data-slot="context-menu-checkbox-item"
    v-bind="forwarded"
    :class="[
      'fui-context-menu-item fui-context-menu-item-indicator relative cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
      props.class,
    ]"
  >
    <span class="pointer-events-none absolute inset-e-2">
      <ContextMenuItemIndicator>
        <slot name="indicator-icon">
          <IconPlaceholder lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
        </slot>
      </ContextMenuItemIndicator>
    </span>
    <slot />
  </ContextMenuCheckboxItem>
</template>

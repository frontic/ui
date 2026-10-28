<script lang="ts">
/** Lets the user choose one option from a group in the menu. */
export default {}
</script>

<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuItemIndicator, DropdownMenuRadioItem, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

defineSlots<{
  /** Replaces the check icon shown on the chosen option. */
  'indicator-icon'?: () => unknown
  default?: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem
    data-slot="dropdown-menu-radio-item"
    v-bind="forwarded"
    :class="[
      'fui-dropdown-menu-item fui-dropdown-menu-item-indicator relative cursor-default outline-hidden select-none data-disabled:pointer-events-none data-disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
      props.class,
    ]"
  >
    <span class="pointer-events-none absolute inset-e-2 flex items-center justify-center" data-slot="dropdown-menu-radio-item-indicator">
      <DropdownMenuItemIndicator>
        <slot name="indicator-icon">
          <IconPlaceholder lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
        </slot>
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItem>
</template>

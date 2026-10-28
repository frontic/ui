<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user switch one option of its group on or off. */
export default {}
</script>

<script setup lang="ts">
import type { ToggleGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ToggleSize, ToggleVariant } from '@library/components/ui/toggle'
import type { ToggleGroupSpacing } from '.'
import { reactiveOmit } from '@vueuse/core'
import { ToggleGroupItem, useForwardProps } from 'reka-ui'
import { inject } from 'vue'
import { Toggle } from '@library/components/ui/toggle'

const props = defineProps<
  ToggleGroupItemProps & {
    class?: HTMLAttributes['class']
    /** The item's visual style when the group sets none: transparent or outlined. */
    variant?: ToggleVariant
    /** The item's size when the group sets none. */
    size?: ToggleSize
  }
>()

const context = inject<{ variant?: ToggleVariant; size?: ToggleSize; spacing?: ToggleGroupSpacing }>('toggleGroup')

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant')
const forwardedProps = useForwardProps(delegatedProps)

type DataState = 'on' | 'off'

defineSlots<{
  /** Holds the item's label or icon; gets whether it is pressed or disabled and its state as `on` or `off`. */
  default?: (props: { modelValue: boolean; state: DataState; pressed: boolean; disabled: boolean }) => unknown
}>()
</script>

<template>
  <ToggleGroupItem v-slot="slotProps" v-bind="forwardedProps" as-child>
    <Toggle
      data-slot="toggle-group-item"
      :data-variant="context?.variant || variant"
      :data-size="context?.size || size"
      :data-spacing="context?.spacing"
      :variant="context?.variant || variant"
      :size="context?.size || size"
      :class="[
        'fui-toggle-group-item hover:z-5 focus:z-10 focus-visible:z-10 aria-pressed:z-10 aria-checked:z-10',
        'group-data-join-x/toggle-group:not-first:rounded-s-none group-data-join-x/toggle-group:not-last:rounded-e-none',
        'group-data-join-y/toggle-group:not-first:rounded-t-none group-data-join-y/toggle-group:not-last:rounded-b-none',
        props.class,
      ]"
    >
      <slot v-bind="slotProps" />
    </Toggle>
  </ToggleGroupItem>
</template>

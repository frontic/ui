<script lang="ts">
/** Groups toggles so the user can choose one or several options. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ToggleSize, ToggleVariant } from '@library/components/ui/toggle'
import { reactiveOmit } from '@vueuse/core'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import type { ToggleGroupSpacing } from '.'
import { computed, provide, useTemplateRef } from 'vue'
import { cva } from 'class-variance-authority'
import { pickedItem, useFieldControl } from '@library/composables/use-field-control'

const props = withDefaults(
  defineProps<
    ToggleGroupRootProps & {
      class?: HTMLAttributes['class']
      /** The visual style of every item: transparent or outlined. */
      variant?: ToggleVariant
      /** The size of every item. */
      size?: ToggleSize
      /** The gap between items, from none to 4 steps; at 0 the items join into one control. */
      spacing?: ToggleGroupSpacing
    }
  >(),
  {
    spacing: 0,
  },
)

const emits = defineEmits<ToggleGroupRootEmits>()

provide('toggleGroup', {
  variant: props.variant,
  size: props.size,
  spacing: props.spacing,
})

const vertical = computed(() => props.orientation === 'vertical')

const SPACING = ['none', 'xs', 'sm', 'md', 'lg'] as const
const toggleGroup = cva('fui-toggle-group group/toggle-group data-vertical:flex-col data-vertical:items-stretch data-join-x:*:not-first:-ms-px data-join-y:*:not-first:-mt-px', {
  variants: {
    spacing: {
      none: 'fui-toggle-group-none',
      xs: 'fui-toggle-group-xs',
      sm: 'fui-toggle-group-sm',
      md: 'fui-toggle-group-md',
      lg: 'fui-toggle-group-lg',
    },
  },
  defaultVariants: { spacing: 'none' },
})

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant', 'spacing')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Delete once Reka's ToggleGroup reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: (root) => pickedItem(root, '[data-slot=toggle-group-item]', (item) => item.dataset.state === 'on'),
})

defineSlots<{
  /** Holds the group's items; gets the pressed value, or the pressed values when several can be pressed. */
  default?: (props: { modelValue: AcceptableValue | AcceptableValue[] | undefined }) => unknown
}>()
</script>

<template>
  <ToggleGroupRoot
    ref="root"
    v-slot="slotProps"
    data-slot="toggle-group"
    :data-size="size"
    :data-variant="variant"
    :data-spacing="spacing"
    :data-vertical="vertical || undefined"
    :data-join-x="(spacing === 0 && !vertical) || undefined"
    :data-join-y="(spacing === 0 && vertical) || undefined"
    v-bind="joined"
    @update:model-value="report"
    :class="[toggleGroup({ spacing: SPACING[spacing] }), props.class]"
  >
    <slot v-bind="slotProps" />
  </ToggleGroupRoot>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups swatches so the user can choose one or several options. */
export default {}
</script>

<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { SwatchShape, SwatchSize } from '@library/components/ui/swatch'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { provide, reactive, toRef, useTemplateRef } from 'vue'
import { type SwatchGroupOrientation, SWATCH_GROUP_INJECTION_KEY } from '.'
import { pickedItem, useFieldControl } from '@library/composables/use-field-control'

const swatchGroup = cva('fui-swatch-group', {
  variants: { orientation: { horizontal: 'fui-swatch-group-horizontal', vertical: 'fui-swatch-group-vertical' } },
  defaultVariants: { orientation: 'horizontal' },
})

const props = withDefaults(
  defineProps<
    ToggleGroupRootProps & {
      class?: HTMLAttributes['class']
      /** The size of every swatch in the group. */
      size?: SwatchSize
      /** The corner shape of every swatch: rounded or a full circle. */
      shape?: SwatchShape
      /** Lays the swatches out in a row, wrapping, or in a column with each label beside its swatch. */
      orientation?: SwatchGroupOrientation
      /** Classes added to every swatch's label; an item's own `labelClass` wins. */
      labelClass?: HTMLAttributes['class']
    }
  >(),
  {
    orientation: 'horizontal',
  },
)
const emits = defineEmits<ToggleGroupRootEmits>()

provide(
  SWATCH_GROUP_INJECTION_KEY,
  reactive({
    size: toRef(props, 'size'),
    shape: toRef(props, 'shape'),
    orientation: toRef(props, 'orientation'),
    labelClass: toRef(props, 'labelClass'),
  }),
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'shape', 'orientation', 'labelClass')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Delete once Reka's ToggleGroup reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: (root) => pickedItem(root, '[data-slot=swatch-group-item]', (item) => item.dataset.state === 'on'),
})
</script>

<template>
  <ToggleGroupRoot ref="root" data-slot="swatch-group" v-bind="joined" @update:model-value="report" :class="[swatchGroup({ orientation }), props.class]">
    <slot />
  </ToggleGroupRoot>
</template>

<script lang="ts">
/** Titles a set of related fields. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'

const legend = cva('fui-field-legend', {
  variants: {
    variant: { legend: 'fui-field-legend-legend', label: 'fui-field-legend-label' },
  },
  defaultVariants: { variant: 'legend' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** Whether the legend reads as a section heading or as a field label. */
      variant?: VariantProps<typeof legend>['variant']
    }
  >(),
  { as: 'legend', variant: 'legend' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="field-legend" :data-variant="variant" :class="[legend({ variant }), props.class]">
    <slot />
  </Primitive>
</template>

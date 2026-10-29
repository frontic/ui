<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { provide } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** Called when the shopper presses a `FilterReset` inside; clear every active filter here. */
      reset?: () => void
    }
  >(),
  { as: 'div' },
)

provide('filter-reset', () => props.reset?.())
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="filter" :class="props.class">
    <slot />
  </Primitive>
</template>

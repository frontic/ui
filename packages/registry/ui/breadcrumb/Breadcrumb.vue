<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** Accessible name of the breadcrumb navigation, read out by screen readers. */
      label?: string
    }
  >(),
  { as: 'nav', label: 'Breadcrumb' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" :aria-label="props.label" data-slot="breadcrumb" :class="props.class">
    <slot />
  </Primitive>
</template>

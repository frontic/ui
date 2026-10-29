<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The `id` of the control the label belongs to, so clicking the label toggles it. */
      for?: string
    }
  >(),
  { as: 'label' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="filter-field-label" :for="props.for" :class="['fui-filter-field-label cursor-pointer', props.class]">
    <slot />
  </Primitive>
</template>

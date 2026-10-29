<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'span' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="swatch-label" :class="['fui-swatch-label', props.class]">
    <slot />
  </Primitive>
</template>

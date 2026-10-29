<script lang="ts">
/** Explains why there is nothing to show and what to do next. */
export default {}
</script>

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
  { as: 'p' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="empty-description" :class="['fui-empty-description', props.class]">
    <slot />
  </Primitive>
</template>

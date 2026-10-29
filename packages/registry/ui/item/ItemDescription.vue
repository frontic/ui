<script lang="ts">
/** Gives more detail about its item below the title. */
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="item-description" :class="['fui-item-description line-clamp-2', props.class]">
    <slot />
  </Primitive>
</template>

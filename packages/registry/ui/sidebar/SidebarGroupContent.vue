<script lang="ts">
/** Holds the menu belonging to a sidebar group. */
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
  { as: 'div' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="sidebar-group-content" data-sidebar="group-content" :class="['fui-sidebar-group-content', props.class]">
    <slot />
  </Primitive>
</template>

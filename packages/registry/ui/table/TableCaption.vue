<script lang="ts">
/** Describes in a short line what the table shows. */
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
  { as: 'caption' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="table-caption" :class="['fui-table-caption', props.class]">
    <slot />
  </Primitive>
</template>

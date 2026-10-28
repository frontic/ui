<script lang="ts">
/** Lists the steps of the breadcrumb in order. */
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
  { as: 'ol' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="breadcrumb-list" :class="['fui-breadcrumb-list wrap-break-word', props.class]">
    <slot />
  </Primitive>
</template>

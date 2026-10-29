<script lang="ts">
/** Groups the title, description and action at the top of the card. */
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="card-header" :class="['fui-card-header group/card-header @container/card-header auto-rows-min', props.class]">
    <slot />
  </Primitive>
</template>

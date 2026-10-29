<script lang="ts">
/** Groups several items into one list. */
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
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    role="list"
    data-slot="item-group"
    :class="['fui-item-group group/item-group has-[[data-size=sm]]:gap-2.5 has-[[data-size=xs]]:gap-2', props.class]"
  >
    <slot />
  </Primitive>
</template>

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
    data-slot="card-action"
    :class="['fui-card-action @sm/card-header:col-start-2 @sm/card-header:justify-self-end @sm/card-header:row-span-2 @sm/card-header:row-start-1', props.class]"
  >
    <slot />
  </Primitive>
</template>

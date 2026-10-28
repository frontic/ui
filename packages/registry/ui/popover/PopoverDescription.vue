<script lang="ts">
/** Explains the popover in a short text below its title. */
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="popover-description" :class="['fui-popover-description', props.class]">
    <slot />
  </Primitive>
</template>

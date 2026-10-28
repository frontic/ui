<script lang="ts">
/** Shows a keyboard key or shortcut. */
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
  { as: 'kbd' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="kbd" :class="['fui-kbd pointer-events-none select-none', props.class]">
    <slot />
  </Primitive>
</template>

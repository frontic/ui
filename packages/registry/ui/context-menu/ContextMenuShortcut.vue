<script lang="ts">
/** Shows the keyboard shortcut for a menu item. */
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
  { as: 'span' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="context-menu-shortcut" :class="['fui-context-menu-shortcut', props.class]">
    <slot />
  </Primitive>
</template>

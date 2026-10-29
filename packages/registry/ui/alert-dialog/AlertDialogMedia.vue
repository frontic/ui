<script lang="ts">
/** Holds an icon or image that illustrates the dialog. */
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="alert-dialog-media" :class="['fui-alert-dialog-media group-data-size-sm/alert-dialog-content:row-auto', props.class]">
    <slot />
  </Primitive>
</template>

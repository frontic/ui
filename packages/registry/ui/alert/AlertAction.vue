<script lang="ts">
/** Holds a button or link that lets the user act on or dismiss the alert. */
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="alert-action" data-alert-action :class="['absolute top-2.5 inset-e-3', props.class]">
    <slot />
  </Primitive>
</template>

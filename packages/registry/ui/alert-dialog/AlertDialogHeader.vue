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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="alert-dialog-header" :class="['fui-alert-dialog-header has-[[data-slot=alert-dialog-media]]:gap-x-6', props.class]">
    <slot />
  </Primitive>
</template>

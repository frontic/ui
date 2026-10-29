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
  { as: 'li' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="breadcrumb-item" :class="['fui-breadcrumb-item', props.class]">
    <slot />
  </Primitive>
</template>

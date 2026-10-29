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
  { as: 'tfoot' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="table-footer" :class="['fui-table-footer *:last:border-b-0', props.class]">
    <slot />
  </Primitive>
</template>

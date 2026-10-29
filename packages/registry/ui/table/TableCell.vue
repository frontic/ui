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
  { as: 'td' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="table-cell" :class="['fui-table-cell align-middle whitespace-nowrap has-[[role=checkbox]]:pe-0', props.class]">
    <slot />
  </Primitive>
</template>

<script lang="ts" setup>
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
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="drawer-footer" :class="['fui-drawer-footer', props.class]">
    <slot />
  </Primitive>
</template>

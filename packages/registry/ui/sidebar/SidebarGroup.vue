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
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="sidebar-group"
    data-sidebar="group"
    :class="['fui-sidebar-group relative group-data-collapsible-icon:[&>[data-sidebar=group-label]]:-mt-8', props.class]"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  {
    as: 'button',
  },
)
</script>

<template>
  <Primitive
    data-slot="sidebar-group-action"
    data-sidebar="group-action"
    :as="as"
    :as-child="asChild"
    :class="[
      'fui-sidebar-action absolute top-3.5 inset-e-3 aspect-square outline-none transition-transform after:absolute after:-inset-2 group-data-collapsible-icon:hidden focus-visible:fui-focus-ring *:data-icon:shrink-0',
      props.class,
    ]"
  >
    <slot />
  </Primitive>
</template>

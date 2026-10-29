<script lang="ts">
/** Labels a group of sidebar items with a heading. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'

const props = defineProps<
  PrimitiveProps & {
    class?: HTMLAttributes['class']
  }
>()
</script>

<template>
  <Primitive
    data-slot="sidebar-group-label"
    data-sidebar="group-label"
    :as="as"
    :as-child="asChild"
    :class="[
      'fui-sidebar-group-label outline-none transition-all duration-200 ease-linear group-data-collapsible-icon:pointer-events-none group-data-collapsible-icon:select-none group-data-collapsible-icon:opacity-0 focus-visible:fui-focus-ring *:data-icon:shrink-0',
      props.class,
    ]"
  >
    <slot />
  </Primitive>
</template>

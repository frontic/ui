<script lang="ts">
/** Lists the nested items under a sidebar menu item. */
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
  { as: 'ul' },
)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="sidebar-menu-sub"
    data-sidebar="menu-sub"
    :class="['fui-sidebar-menu-sub translate-x-px group-data-collapsible-icon:hidden', props.class]"
  >
    <slot />
  </Primitive>
</template>

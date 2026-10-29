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
    data-slot="sidebar-menu-badge"
    data-sidebar="menu-badge"
    :class="[
      'fui-sidebar-menu-badge pointer-events-none absolute inset-e-1 top-1.5 tabular-nums select-none peer-data-size-sm/menu-button:top-1 peer-data-size-lg/menu-button:top-2.5 group-data-collapsible-icon:hidden',
      props.class,
    ]"
  >
    <slot />
  </Primitive>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups one nested entry of a sidebar submenu. */
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
  { as: 'li' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" :class="['group/menu-sub-item relative', props.class]">
    <slot />
  </Primitive>
</template>

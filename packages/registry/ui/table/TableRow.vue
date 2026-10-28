<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups the cells that belong to one entry of the table. */
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
  { as: 'tr' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="table-row" :data-selected="$attrs['data-state'] === 'selected' || undefined" :class="['fui-table-row transition-colors', props.class]">
    <slot />
  </Primitive>
</template>

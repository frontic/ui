<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Labels one column of the table. */
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
  { as: 'th' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="table-head" :class="['fui-table-head align-middle whitespace-nowrap has-[[role=checkbox]]:pe-0', props.class]">
    <slot />
  </Primitive>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the breadcrumb, which shows where the current page sits. */
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
      /** Accessible name of the breadcrumb navigation, read out by screen readers. */
      label?: string
    }
  >(),
  { as: 'nav', label: 'Breadcrumb' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" :aria-label="props.label" data-slot="breadcrumb" :class="props.class">
    <slot />
  </Primitive>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Stacks a filter option's label and description beside its control. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
const props = withDefaults(defineProps<PrimitiveProps>(), { as: 'div' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="filter-field-content" class="fui-filter-field-content">
    <slot />
  </Primitive>
</template>

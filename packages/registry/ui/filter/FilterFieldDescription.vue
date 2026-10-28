<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Explains a filter option below its label. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
const props = withDefaults(defineProps<PrimitiveProps>(), { as: 'p' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="filter-field-description" class="fui-filter-field-description">
    <slot />
  </Primitive>
</template>

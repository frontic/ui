<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** A line of text in the panel, such as "No results for …"; the shop decides when it shows. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), { as: 'div' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="search-empty" role="presentation" :class="['fui-search-empty', props.class]">
    <slot />
  </Primitive>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Holds a note below the price, such as tax and shipping, which may link on. */
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
  { as: 'span' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="price-hint" :class="['fui-price-hint', props.class]">
    <slot />
  </Primitive>
</template>

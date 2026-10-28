<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups the title, control and description of one filter option. */
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
      /** Whether the control sits below or beside its title, exposed as `data-orientation` for styling. */
      orientation?: 'vertical' | 'horizontal'
      /** Marks the option as unavailable with `data-disabled`, e.g. when no products match it. */
      disabled?: boolean
    }
  >(),
  { as: 'div' },
)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    role="group"
    data-slot="filter-field"
    :data-orientation="orientation"
    :data-disabled="disabled || undefined"
    :class="['fui-filter-field', props.class]"
  >
    <slot />
  </Primitive>
</template>

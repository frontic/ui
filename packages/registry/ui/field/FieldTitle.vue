<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows the title of a field next to its description. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { fronticFieldOrientation } from './keys'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div' },
)

/** A title in a horizontal Field sits beside its checkbox, radio or switch, as a label there does. */
const orientation = inject(fronticFieldOrientation, undefined)
const beside = () => orientation?.value === 'horizontal'
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="field-title"
    :class="['fui-field-label items-center group-data-disabled/field:fui-disabled', beside() ? 'fui-field-label-beside' : 'fui-field-label-default', props.class]"
  >
    <slot />
  </Primitive>
</template>

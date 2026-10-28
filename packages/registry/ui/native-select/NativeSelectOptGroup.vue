<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups related options of the native select under a shared heading. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), { as: 'optgroup' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="native-select-optgroup" :class="['fui-native-select-option', props.class]">
    <slot />
  </Primitive>
</template>

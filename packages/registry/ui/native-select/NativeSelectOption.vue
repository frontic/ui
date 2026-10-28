<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Offers one choice the user can pick in the native select. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), { as: 'option' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="native-select-option" :class="['fui-native-select-option', props.class]">
    <slot />
  </Primitive>
</template>

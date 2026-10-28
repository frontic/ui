<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Links to a higher level of the breadcrumb trail. */
export default {}
</script>

<script lang="ts" setup>
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'a',
})
</script>

<template>
  <Primitive data-slot="breadcrumb-link" :as="props.as" :as-child="props.asChild" :class="['fui-breadcrumb-link transition-colors', props.class]">
    <slot />
  </Primitive>
</template>

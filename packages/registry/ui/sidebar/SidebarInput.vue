<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user search or filter from within the sidebar. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Input } from '@library/components/ui/input'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Input data-slot="sidebar-input" data-sidebar="input" :class="['fui-sidebar-input', props.class]">
    <slot />
  </Input>
</template>

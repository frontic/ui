<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user enter a single line of text inside the group. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { Input } from '@library/components/ui/input'
import { fronticInputGroupSize } from './keys'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const size = inject(fronticInputGroupSize, undefined)
</script>

<template>
  <Input
    data-slot="input-group-control"
    :size="size"
    :class="[
      'fui-input-group-input border-0 focus-visible:border-b-0 bg-transparent group-has-[>[data-align=inline-start]]/input-group:ps-2 group-has-[>[data-align=inline-end]]/input-group:pe-2',
      props.class,
    ]"
  />
</template>

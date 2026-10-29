<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ComboboxGroup, ComboboxLabel } from 'reka-ui'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** Shown above the group's rows and names the group for screen readers. */
  heading?: string
}>()
</script>

<template>
  <ComboboxGroup data-slot="search-group" :class="['fui-search-group', props.class]">
    <ComboboxLabel v-if="props.heading" class="fui-search-group-heading">{{ props.heading }}</ComboboxLabel>
    <slot />
  </ComboboxGroup>
</template>

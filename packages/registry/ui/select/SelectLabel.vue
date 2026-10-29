<script lang="ts">
/** Labels a group of options in the select. */
export default {}
</script>

<script setup lang="ts">
import type { SelectLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { SelectLabel } from 'reka-ui'

const props = defineProps<SelectLabelProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectLabel data-slot="select-label" :class="['fui-select-label', props.class]">
    <slot />
  </SelectLabel>
</template>

<script lang="ts">
/** Separates groups of options in the select. */
export default {}
</script>

<script setup lang="ts">
import type { SelectSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectSeparator, useForwardProps } from 'reka-ui'

const props = defineProps<SelectSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <SelectSeparator data-slot="select-separator" v-bind="forwarded" :class="['fui-select-separator pointer-events-none', props.class]" />
</template>

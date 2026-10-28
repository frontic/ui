<script lang="ts">
/** Groups related options of the select. */
export default {}
</script>

<script setup lang="ts">
import type { SelectGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectGroup, useForwardProps } from 'reka-ui'

const props = defineProps<SelectGroupProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <SelectGroup data-slot="select-group" v-bind="forwarded" :class="['fui-select-group scroll-my-1.5', props.class]">
    <slot />
  </SelectGroup>
</template>

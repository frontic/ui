<script setup lang="ts">
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Label, useForwardProps } from 'reka-ui'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <Label
    data-slot="label"
    v-bind="forwarded"
    :class="['fui-label-root select-none group-data-disabled:pointer-events-none group-data-disabled:fui-disabled peer-disabled:cursor-not-allowed peer-disabled:fui-disabled', props.class]"
  >
    <slot />
  </Label>
</template>

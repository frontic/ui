<script lang="ts">
/** Separates two buttons inside a button group. */
export default {}
</script>

<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { Separator, useForwardProps } from 'reka-ui'

const separator = cva('fui-button-group-separator relative', {
  variants: {
    orientation: { vertical: 'fui-button-group-separator-vertical', horizontal: 'fui-button-group-separator-horizontal' },
  },
  defaultVariants: { orientation: 'vertical' },
})

const props = withDefaults(defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>(), {
  orientation: 'vertical',
})

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <Separator
    data-slot="button-group-separator"
    v-bind="forwarded"
    :orientation="props.orientation"
    :data-horizontal="props.orientation === 'horizontal' || undefined"
    :data-vertical="props.orientation === 'vertical' || undefined"
    :class="[separator({ orientation: props.orientation }), props.class]"
  />
</template>

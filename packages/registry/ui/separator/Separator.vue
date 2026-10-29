<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { Separator, useForwardProps } from 'reka-ui'

const props = withDefaults(defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>(), {
  orientation: 'horizontal',
  decorative: true,
})

const delegatedProps = reactiveOmit(props, 'class')

const separator = cva('fui-separator', {
  variants: {
    orientation: {
      horizontal: 'fui-separator-horizontal',
      vertical: 'fui-separator-vertical',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <Separator data-slot="separator" v-bind="forwarded" :class="[separator({ orientation: props.orientation }), props.class]" />
</template>

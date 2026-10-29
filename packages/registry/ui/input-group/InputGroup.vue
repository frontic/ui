<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { InputGroupSize } from '.'
import { cva } from 'class-variance-authority'
import { provide, toRef } from 'vue'
import { fronticInputGroupSize } from './keys'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The height of the group; the input inside it follows. */
      size?: InputGroupSize
    }
  >(),
  { as: 'div' },
)

const group = cva(
  'fui-input-group group/input-group relative outline-none transition-colors has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3',
  {
    variants: {
      size: { md: 'fui-input-group-md', sm: 'fui-input-group-sm' },
    },
    defaultVariants: { size: 'md' },
  },
)

provide(fronticInputGroupSize, toRef(props, 'size'))
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="input-group" role="group" :data-size="props.size ?? 'md'" :class="[group({ size: props.size }), props.class]">
    <slot />
  </Primitive>
</template>

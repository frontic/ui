<script lang="ts">
/** Places an icon, text or button beside the input of its group. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { InputGroupAddonAlign } from '.'
import { cva } from 'class-variance-authority'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** Where the addon sits: before or after the input on its line, or above or below it. */
      align?: InputGroupAddonAlign
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div', align: 'inline-start' },
)

const addon = cva('fui-input-group-addon cursor-text select-none [&_[data-slot=kbd]]:rounded-none [&_[data-slot=kbd]]:px-1.5 group-data-disabled/input-group:fui-disabled', {
  variants: {
    align: {
      'inline-start': 'fui-input-group-addon-inline-start',
      'inline-end': 'fui-input-group-addon-inline-end',
      'block-start': 'fui-input-group-addon-block-start',
      'block-end': 'fui-input-group-addon-block-end',
    },
  },
  defaultVariants: { align: 'inline-start' },
})
const ALIGN_LAYOUT: Record<InputGroupAddonAlign, string> = {
  'inline-start': 'order-first',
  'inline-end': 'order-last',
  'block-start': 'order-first w-full justify-start group-has-[>input]/input-group:pt-3.5',
  'block-end': 'order-last w-full justify-start group-has-[>input]/input-group:pb-3.5',
}

function handleInputGroupAddonClick(e: MouseEvent) {
  const currentTarget = e.currentTarget as HTMLElement | null
  const target = e.target as HTMLElement | null
  if (target && target.closest('button')) {
    return
  }
  if (currentTarget && currentTarget?.parentElement) {
    currentTarget.parentElement?.querySelector<HTMLElement>('input, textarea')?.focus()
  }
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    role="group"
    data-slot="input-group-addon"
    :data-align="props.align"
    :class="[addon({ align: props.align }), ALIGN_LAYOUT[props.align], props.class]"
    @click="handleInputGroupAddonClick"
  >
    <slot />
  </Primitive>
</template>

<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows an icon, image or avatar at the start of its item. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ItemMediaVariant } from '.'
import { cva } from 'class-variance-authority'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** How the media is framed: as is, sized as an icon, or as a square image. */
      variant?: ItemMediaVariant
    }
  >(),
  { as: 'div', variant: 'default' },
)

const itemMedia = cva('fui-item-media [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start', {
  variants: {
    variant: {
      default: 'fui-item-media-default',
      icon: 'fui-item-media-icon',
      image: 'fui-item-media-image',
    },
  },
  defaultVariants: { variant: 'default' },
})
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="item-media"
    :data-variant="props.variant"
    :class="[itemMedia({ variant: props.variant }), props.variant === 'image' && 'overflow-hidden [&_img]:size-full [&_img]:object-cover', props.class]"
  >
    <slot />
  </Primitive>
</template>

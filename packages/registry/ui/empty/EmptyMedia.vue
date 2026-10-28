<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows an icon or image above the title of the empty state. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { EmptyMediaVariant } from '.'
import { cva } from 'class-variance-authority'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** `icon` puts the icon on a small muted tile; `default` shows the media as is. */
      variant?: EmptyMediaVariant
    }
  >(),
  { as: 'div', variant: 'default' },
)

const emptyMedia = cva('fui-empty-media [&_svg]:pointer-events-none [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'fui-empty-media-default',
      icon: 'fui-empty-media-icon',
    },
  },
  defaultVariants: { variant: 'default' },
})
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="empty-media" :data-variant="props.variant" :class="[emptyMedia({ variant: props.variant }), props.class]">
    <slot />
  </Primitive>
</template>

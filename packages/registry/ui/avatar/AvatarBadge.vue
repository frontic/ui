<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed, inject } from 'vue'
import { AVATAR_SIZE } from './context'

const avatarBadge = cva('fui-avatar-badge absolute inset-e-0 bottom-0 z-10 bg-blend-color select-none', {
  variants: {
    size: {
      sm: 'fui-avatar-badge-sm',
      md: 'fui-avatar-badge-md',
      lg: 'fui-avatar-badge-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'span' },
)

const size = inject(
  AVATAR_SIZE,
  computed(() => 'md' as const),
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="avatar-badge" :class="[avatarBadge({ size }), size === 'sm' && '*:hidden', props.class]">
    <slot />
  </Primitive>
</template>

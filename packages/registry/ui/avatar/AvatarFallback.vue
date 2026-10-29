<script lang="ts">
/** Shows initials or an icon when the avatar image is missing or fails to load. */
export default {}
</script>

<script setup lang="ts">
import type { AvatarFallbackProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { AvatarFallback, useForwardProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { AVATAR_SIZE } from './context'

const avatarFallback = cva('fui-avatar-fallback', {
  variants: {
    size: {
      sm: 'fui-avatar-fallback-sm',
      md: 'fui-avatar-fallback-md',
      lg: 'fui-avatar-fallback-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

const props = defineProps<AvatarFallbackProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const size = inject(
  AVATAR_SIZE,
  computed(() => 'md' as const),
)
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarFallback data-slot="avatar-fallback" v-bind="forwarded" :class="[avatarFallback({ size }), props.class]">
    <slot />
  </AvatarFallback>
</template>

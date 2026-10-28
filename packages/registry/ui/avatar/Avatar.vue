<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups the image, fallback and badge of an avatar. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AvatarSize } from './context'
import { cva } from 'class-variance-authority'
import { AvatarRoot } from 'reka-ui'
import { computed, inject, provide } from 'vue'
import { AVATAR_GROUP, AVATAR_SIZE } from './context'

const avatar = cva('fui-avatar group/avatar relative select-none after:absolute after:inset-0 after:mix-blend-darken', {
  variants: {
    size: {
      sm: 'fui-avatar-sm',
      md: 'fui-avatar-md',
      lg: 'fui-avatar-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** The avatar's diameter; fallback and badge scale with it. Defaults to its group's size, else md. */
  size?: AvatarSize
}>()

const group = inject(AVATAR_GROUP, null)
const grouped = group !== null
const size = computed(() => props.size ?? group?.value ?? 'md')
provide(AVATAR_SIZE, size)
</script>

<template>
  <AvatarRoot data-slot="avatar" :data-size="size" :class="[avatar({ size }), grouped && 'fui-avatar-ring', props.class]">
    <slot />
  </AvatarRoot>
</template>

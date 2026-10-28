<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows how many more avatars the group holds than it displays. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { AvatarSize } from './context'
import { cva } from 'class-variance-authority'
import { computed, inject } from 'vue'
import { AVATAR_GROUP } from './context'

const avatarGroupCount = cva('fui-avatar-group-count relative', {
  variants: {
    size: {
      sm: 'fui-avatar-group-count-sm',
      md: 'fui-avatar-group-count-md',
      lg: 'fui-avatar-group-count-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The count's diameter. Defaults to its group's size, else md. */
      size?: AvatarSize
    }
  >(),
  { as: 'div' },
)

const group = inject(AVATAR_GROUP, null)
const size = computed(() => props.size ?? group?.value ?? 'md')
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="avatar-group-count" :data-size="size" :class="[avatarGroupCount({ size }), props.class]">
    <slot />
  </Primitive>
</template>

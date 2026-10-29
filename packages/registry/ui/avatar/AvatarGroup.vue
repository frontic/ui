<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { AvatarSize } from './context'
import { computed, provide } from 'vue'
import { AVATAR_GROUP } from './context'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** The size of every avatar and count in the group; one of them sets its own to differ. */
      size?: AvatarSize
    }
  >(),
  { as: 'div' },
)

provide(
  AVATAR_GROUP,
  computed(() => props.size),
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="avatar-group" :class="['fui-avatar-group group/avatar-group -space-x-2', props.class]">
    <slot />
  </Primitive>
</template>

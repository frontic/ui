<script setup lang="ts">
import type { AvatarImageProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AvatarImage, useForwardProps } from 'reka-ui'

const props = defineProps<AvatarImageProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarImage data-slot="avatar-image" v-bind="forwarded" :class="['fui-avatar-image aspect-square object-cover', props.class]">
    <slot />
  </AvatarImage>
</template>

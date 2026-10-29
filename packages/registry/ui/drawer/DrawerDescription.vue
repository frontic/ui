<script lang="ts" setup>
import type { DrawerDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerDescription, useForwardProps } from 'reka-ui'

const props = defineProps<DrawerDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DrawerDescription data-slot="drawer-description" v-bind="forwarded" :class="['fui-drawer-description', props.class]">
    <slot />
  </DrawerDescription>
</template>

<script lang="ts">
/** Names the drawer. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerTitle, useForwardProps } from 'reka-ui'

const props = defineProps<DrawerTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DrawerTitle data-slot="drawer-title" v-bind="forwarded" :class="['fui-drawer-title', props.class]">
    <slot />
  </DrawerTitle>
</template>

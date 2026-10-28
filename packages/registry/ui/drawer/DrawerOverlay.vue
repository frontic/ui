<script lang="ts">
/** Covers the page behind the open drawer. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerOverlayProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerOverlay, useForwardProps } from 'reka-ui'

const props = defineProps<DrawerOverlayProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DrawerOverlay
    data-slot="drawer-overlay"
    v-bind="forwarded"
    :class="['fui-drawer-overlay data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 z-50 supports-backdrop-filter:backdrop-blur-sm', props.class]"
  />
</template>

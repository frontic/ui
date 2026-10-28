<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Explains the purpose of the drawer below its title. */
export default {}
</script>

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

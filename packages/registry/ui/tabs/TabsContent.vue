<script lang="ts">
/** Holds what its tab shows while that tab is selected. */
export default {}
</script>

<script setup lang="ts">
import type { TabsContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsContent, useForwardProps } from 'reka-ui'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <TabsContent data-slot="tabs-content" :class="['fui-tabs-content outline-none', props.class]" v-bind="forwarded">
    <slot />
  </TabsContent>
</template>

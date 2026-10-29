<script lang="ts">
/** Holds content that scrolls within a fixed area. */
export default {}
</script>

<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport, useForwardProps } from 'reka-ui'
import ScrollBar from './ScrollBar.vue'

const props = withDefaults(
  defineProps<
    ScrollAreaRootProps & {
      class?: HTMLAttributes['class']
      /** The direction the content scrolls in, and so the bars it draws. */
      orientation?: 'vertical' | 'horizontal' | 'both'
    }
  >(),
  { orientation: 'vertical' },
)

const delegatedProps = reactiveOmit(props, 'class', 'orientation')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ScrollAreaRoot data-slot="scroll-area" v-bind="forwarded" :class="['relative', props.class]">
    <ScrollAreaViewport data-slot="scroll-area-viewport" class="fui-scroll-area-viewport size-full outline-none">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar v-if="props.orientation !== 'horizontal'" />
    <ScrollBar v-if="props.orientation !== 'vertical'" orientation="horizontal" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

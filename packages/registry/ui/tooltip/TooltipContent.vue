<script lang="ts">
/** Holds the short hint the tooltip shows. */
export default {}
</script>

<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(), {
  sideOffset: 0,
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="[
        'fui-tooltip-content has-[[data-slot=kbd]]:pe-1.5 [&_[data-slot=kbd]]:relative [&_[data-slot=kbd]]:isolate [&_[data-slot=kbd]]:z-50 z-50 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-state-delayed-open:animate-in data-state-delayed-open:fade-in-0 data-state-delayed-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-side-bottom:slide-in-from-top-2 data-side-left:slide-in-from-right-2 data-side-right:slide-in-from-left-2 data-side-top:slide-in-from-bottom-2 origin-(--reka-tooltip-content-transform-origin)',
        props.class,
      ]"
    >
      <slot />

      <TooltipArrow aria-hidden="true" class="fui-tooltip-arrow z-50 -translate-y-1/2 rotate-45" />
    </TooltipContent>
  </TooltipPortal>
</template>

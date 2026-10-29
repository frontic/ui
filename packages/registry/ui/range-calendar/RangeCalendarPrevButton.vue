<script lang="ts">
/** Moves the range calendar to the previous month. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarPrevProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarPrev, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<RangeCalendarPrevProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarPrev
    data-slot="range-calendar-prev-button"
    :class="[
      'fui-range-calendar-nav group/button absolute inset-s-1 whitespace-nowrap bg-clip-padding outline-none transition-all select-none focus-visible:fui-focus-ring aria-invalid:fui-invalid disabled:pointer-events-none disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
      props.class,
    ]"
    v-bind="forwardedProps"
  >
    <slot>
      <IconPlaceholder lucide="ChevronLeftIcon" tabler="IconChevronLeft" hugeicons="ArrowLeft01Icon" phosphor="CaretLeftIcon" remixicon="RiArrowLeftSLine" class="rtl:-scale-x-100" data-icon />
    </slot>
  </RangeCalendarPrev>
</template>

<script lang="ts">
/** Lets the user move the calendar to the next month. */
export default {}
</script>

<script lang="ts" setup>
import type { CalendarNextProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarNext, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<CalendarNextProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarNext
    data-slot="calendar-next-button"
    :class="[
      'fui-calendar-nav group/button whitespace-nowrap bg-clip-padding outline-none transition-all select-none pointer-events-auto focus-visible:fui-focus-ring aria-invalid:fui-invalid disabled:pointer-events-none disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0',
      props.class,
    ]"
    v-bind="forwardedProps"
  >
    <slot>
      <IconPlaceholder lucide="ChevronRightIcon" tabler="IconChevronRight" hugeicons="ArrowRight01Icon" phosphor="CaretRightIcon" remixicon="RiArrowRightSLine" class="rtl:-scale-x-100" data-icon />
    </slot>
  </CalendarNext>
</template>

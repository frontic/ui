<script lang="ts" setup>
import type { RangeCalendarHeadingProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarHeading, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarHeadingProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  /** Replaces the heading text; gets the month and year as `headingValue`. */
  default: (props: { headingValue: string }) => any
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarHeading v-slot="{ headingValue }" data-slot="range-calendar-heading" :class="['fui-range-calendar-heading', props.class]" v-bind="forwardedProps">
    <slot :heading-value>
      {{ headingValue }}
    </slot>
  </RangeCalendarHeading>
</template>

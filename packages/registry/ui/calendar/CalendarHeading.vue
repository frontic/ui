<script lang="ts" setup>
import type { CalendarHeadingProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CalendarHeading, useForwardProps } from 'reka-ui'

const props = defineProps<CalendarHeadingProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  /** Replaces the heading text; gets the formatted month and year. */
  default: (props: { headingValue: string }) => any
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarHeading v-slot="{ headingValue }" data-slot="calendar-heading" :class="['fui-calendar-heading', props.class]" v-bind="forwardedProps">
    <slot :heading-value>
      {{ headingValue }}
    </slot>
  </CalendarHeading>
</template>

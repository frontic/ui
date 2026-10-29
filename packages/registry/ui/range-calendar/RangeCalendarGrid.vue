<script lang="ts">
/** Holds the weekday names and days of one month. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarGridProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarGrid, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarGridProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarGrid data-slot="range-calendar-grid" :class="['border-collapse space-x-1', props.class]" v-bind="forwardedProps">
    <slot />
  </RangeCalendarGrid>
</template>

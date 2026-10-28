<script lang="ts">
/** Groups the heading with the buttons that change the month. */
export default {}
</script>

<script lang="ts" setup>
import type { RangeCalendarHeaderProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarHeader, useForwardProps } from 'reka-ui'

const props = defineProps<RangeCalendarHeaderProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarHeader data-slot="range-calendar-header" :class="['fui-range-calendar-header relative', props.class]" v-bind="forwardedProps">
    <slot />
  </RangeCalendarHeader>
</template>

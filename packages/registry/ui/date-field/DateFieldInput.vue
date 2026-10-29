<script lang="ts">
/** One segment of the date, such as the day or the month, or a separator between two. */
export default {}
</script>

<script setup lang="ts">
import type { DateFieldInputProps, DateRangeFieldInputProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DateFieldInput, DateRangeFieldInput, useForwardProps } from 'reka-ui'

const props = defineProps<
  DateFieldInputProps & {
    /** Inside a DateRangePicker: which of its two dates the segment belongs to. */
    type?: DateRangeFieldInputProps['type']
    class?: HTMLAttributes['class']
  }
>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <component
    :is="props.type ? DateRangeFieldInput : DateFieldInput"
    data-slot="date-field-input"
    v-bind="forwarded"
    :class="[props.part === 'literal' ? 'fui-date-field-literal' : 'fui-date-field-segment outline-none first:-ms-0.5', props.class]"
  >
    <slot />
  </component>
</template>

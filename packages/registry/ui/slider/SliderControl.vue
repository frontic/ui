<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { useId, useTemplateRef } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { useFieldControl } from '@library/composables/use-field-control'

const props = defineProps<
  SliderRootProps & {
    /** Reads a thumb's value out for screen readers. */
    format?: (value: number) => string
    /** Names each thumb for screen readers, after the Field's label. */
    thumbLabels?: string[]
    /** Names the thumbs when the Field has no label. */
    ariaLabel?: string
    /** Names the thumbs by these ids when the Field has no label. */
    ariaLabelledby?: string
  }
>()
const emits = defineEmits<SliderRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'format', 'thumbLabels', 'ariaLabel', 'ariaLabelledby'), emits)

// Delete once Reka's Slider reads the Field itself; the thumbs take the aria.
const { joined, report, field } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('sliderRoot'),
  element: (root) => root?.querySelector<HTMLElement>('[role=slider]'),
  aria: 'none',
})
const thumbId = useId()
// Reka's own names for a range's two thumbs.
const RANGE_LABELS = ['Minimum', 'Maximum']
// A range thumb is named by the Field's label and then its own: "Price Minimum".
function thumbAttrs(index: number, count: number, thumbValue: number | undefined) {
  const own = props.thumbLabels?.[index] ?? (count === 2 ? RANGE_LABELS[index] : undefined)
  const id = `${thumbId}-${index}`
  const by = field?.labelId.value ?? props.ariaLabelledby
  return {
    id,
    ...(by ? { 'aria-labelledby': own ? `${by} ${id}` : by, ...(own ? { 'aria-label': own } : {}) } : { 'aria-label': [props.ariaLabel, own].filter(Boolean).join(' ') || undefined }),
    ...(props.format && thumbValue !== undefined ? { 'aria-valuetext': props.format(thumbValue) } : {}),
    ...(field
      ? {
          'aria-describedby': field.describedBy.value,
          'aria-invalid': (field.invalid.value && !field.disabled.value) || undefined,
        }
      : {}),
  }
}
</script>

<template>
  <SliderRoot
    ref="sliderRoot"
    v-slot="{ modelValue }"
    data-slot="slider-root"
    :data-vertical="props.orientation === 'vertical' ? '' : undefined"
    class="fui-slider-control relative touch-none select-none data-disabled:fui-disabled data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col"
    v-bind="joined"
    @update:model-value="report"
  >
    <SliderTrack
      data-slot="slider-track"
      :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
      :data-vertical="props.orientation === 'vertical' ? '' : undefined"
      class="fui-slider-track relative grow overflow-hidden data-horizontal:w-full data-vertical:h-full"
    >
      <SliderRange
        data-slot="slider-range"
        :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
        :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        class="fui-slider-range absolute select-none data-horizontal:h-full data-vertical:w-full"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(thumbValue, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      :data-vertical="props.orientation === 'vertical' ? '' : undefined"
      v-bind="thumbAttrs(key, modelValue?.length ?? 0, thumbValue)"
      class="fui-slider-thumb relative block shrink-0 select-none outline-none transition-colors after:absolute after:-inset-1.5 data-disabled:pointer-events-none data-disabled:fui-disabled"
    />
  </SliderRoot>
</template>

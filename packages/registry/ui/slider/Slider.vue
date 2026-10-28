<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user pick a value or range by dragging a handle along a track. */
export default {}
</script>

<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { NumberFormatter } from '@internationalized/number'
import { reactiveOmit } from '@vueuse/core'
import { injectFieldRootContext, useForwardPropsEmits, useLocale } from 'reka-ui'
import { Field, FieldLabel } from '@library/components/ui/field'
import SliderControl from './SliderControl.vue'
import { toRef } from 'vue'

const props = withDefaults(
  defineProps<
    SliderRootProps & {
      class?: HTMLAttributes['class']
      /** Shown as the field label above the slider; inside a Field, that Field's own label names it instead. */
      label?: string
      /** Shows the minimum and maximum values below the track. */
      showLegend?: boolean
      /** How the legend shows a value and a screen reader reads a thumb's, e.g. `{ style: 'currency', currency: 'EUR' }`. */
      formatOptions?: Intl.NumberFormatOptions
      /** BCP 47 locale the values are formatted in; the ConfigProvider's when left out. */
      locale?: string
      /** Formats a value for the legend and a screen reader, e.g. a price kept in cents; wins over `formatOptions`. */
      format?: (value: number) => string
      /** Names each thumb for screen readers, after the label; Reka's "Minimum" and "Maximum" for a range when left out. */
      thumbLabels?: string[]
      /** Names the thumbs when there is no `label` and no Field label, e.g. inside a filter that shows its own title. */
      ariaLabel?: string
      /** Ids of the elements that name the thumbs when there is no `label` and no Field label. */
      ariaLabelledby?: string
    }
  >(),
  {
    min: 0,
    max: 100,
    step: 1,
  },
)
const locale = useLocale(toRef(() => props.locale))

const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'label', 'showLegend', 'format', 'formatOptions', 'locale', 'thumbLabels', 'ariaLabel', 'ariaLabelledby')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/** Inside a Field of the consumer's the slider joins that one; on its own it brings a Field for its label. */
const outer = injectFieldRootContext(null)

const format = (value: number) => props.format?.(value) ?? (props.formatOptions ? new NumberFormatter(locale.value, props.formatOptions).format(value) : String(value))
</script>

<template>
  <component :is="outer ? 'div' : Field" data-slot="slider" :class="props.class">
    <FieldLabel v-if="label && !outer" :native-label="false">
      {{ label }}
    </FieldLabel>

    <SliderControl v-bind="forwarded" :format="props.format || formatOptions ? format : undefined" :thumb-labels="thumbLabels" :aria-label="ariaLabel" :aria-labelledby="ariaLabelledby" />

    <div v-if="showLegend" data-slot="slider-legend" class="fui-slider-legend flex justify-between">
      <span>{{ format(min) }}</span>
      <span>{{ format(max) }}</span>
    </div>
  </component>
</template>

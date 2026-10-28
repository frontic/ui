<script lang="ts">
/** Lets the user limit a numeric value to a range with a slider. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject, ref, useId, watch } from 'vue'
import { Slider } from '@library/components/ui/slider'
import { FILTER_GROUP_LABEL } from './context'
import FilterField from './FilterField.vue'
import FilterFieldDescription from './FilterFieldDescription.vue'
import FilterFieldTitle from './FilterFieldTitle.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown as the filter's title. */
    label?: string
    /** Shown as a hint below the title. */
    description?: string
    /** Names the slider for screen readers when its title sits outside it, e.g. on an accordion trigger or a popover button. */
    ariaLabel?: string
    /** Lowest value on the slider. */
    min?: number
    /** Highest value on the slider. */
    max?: number
    /** Amount the slider moves per step. */
    step?: number
    /** The selected range; with only `to`, a single handle sets the highest value. */
    value?: { from?: number; to?: number }
    /** Greys out the slider so the shopper cannot change it. */
    disabled?: boolean
    /** Formats each value in the readout next to the title, e.g. adding a unit; the plain number when left out. */
    formatValue?: (value: number) => string
    /** Builds the text shown for a single-handle maximum from the formatted value. */
    upTo?: (value: string) => string
  }>(),
  {
    upTo: (value: string) => `Up to ${value}`,
    min: 0,
    max: 1000,
    step: 1,
    disabled: false,
  },
)

const emit = defineEmits<{
  /** Fires with the selected range as the user moves the slider; with a single handle, only `to`. */
  change: [value: { from?: number; to?: number }]
}>()

const sliderValue = ref<number[]>(computeSliderValue())

function computeSliderValue(): number[] {
  if (props.value?.from !== undefined && props.value?.to !== undefined) {
    return [props.value.from, props.value.to]
  }
  if (props.value?.to !== undefined) {
    return [props.value.to]
  }
  return [props.max ?? 1000]
}

watch(
  () => props.value,
  () => {
    sliderValue.value = computeSliderValue()
  },
  { deep: true },
)

function handleUpdate(val: number[] | undefined) {
  if (!val) return
  sliderValue.value = val
  if (val.length === 2) {
    emit('change', { from: val[0]!, to: val[1]! })
  } else {
    emit('change', { to: val[0]! })
  }
}

const titleId = useId()
// Without its own title, the thumbs take the name of the group the slider sits in.
const groupLabel = inject(FILTER_GROUP_LABEL, undefined)

const displayValue = computed(() => {
  const fmt = props.formatValue ?? ((v: number) => String(v))
  if (sliderValue.value.length === 2) {
    return `${fmt(sliderValue.value[0]!)} – ${fmt(sliderValue.value[1]!)}`
  }
  return props.upTo(fmt(sliderValue.value[0]!))
})
</script>

<template>
  <FilterField data-slot="filter-slider" :disabled="disabled" :class="['fui-filter-slider', props.class]">
    <div class="flex items-baseline justify-between gap-2">
      <FilterFieldTitle v-if="label" :id="titleId">
        {{ label }}
      </FilterFieldTitle>
      <span data-slot="filter-slider-value" class="fui-filter-meta shrink-0 whitespace-nowrap tabular-nums">
        {{ displayValue }}
      </span>
    </div>
    <FilterFieldDescription v-if="description">
      {{ description }}
    </FilterFieldDescription>
    <Slider
      :model-value="sliderValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :format="formatValue"
      :aria-labelledby="label ? titleId : undefined"
      :aria-label="label ? undefined : (ariaLabel ?? groupLabel)"
      @update:model-value="handleUpdate"
    />
  </FilterField>
</template>

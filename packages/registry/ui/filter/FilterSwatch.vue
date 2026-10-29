<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed, inject } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import type { SwatchShape, SwatchSize } from '@library/components/ui/swatch'
import { SwatchGroup, SwatchGroupItem, type SwatchGroupOrientation } from '@library/components/ui/swatch-group'
import { FILTER_GROUP_LABEL } from './context'

export interface FilterSwatchOption {
  value: string
  hex: string
  label?: string
  count?: number
  selected?: boolean
  disabled?: boolean
}

const filterSwatch = cva('fui-filter-swatch', {
  variants: { orientation: { horizontal: 'fui-filter-swatch-horizontal', vertical: 'fui-filter-swatch-vertical' } },
  defaultVariants: { orientation: 'vertical' },
})

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The colours to list, each with its hex, label, result count and selected state. */
    options: FilterSwatchOption[]
    /** Whether the shopper can select one colour or several. */
    type?: 'single' | 'multiple'
    /** Disables every swatch. */
    disabled?: boolean
    /** The swatch corners: rounded or fully round. */
    shape?: SwatchShape
    /** The swatch diameter. */
    size?: SwatchSize
    /** A scrolling column of swatches with their labels, or a row of swatches. */
    orientation?: SwatchGroupOrientation
    /** Classes for each swatch's label; unused for options that carry a count. */
    labelClass?: HTMLAttributes['class']
    /** Names the list for screen readers when its title sits outside it, e.g. on an accordion trigger or a popover button; inside a FilterGroup its label is the default. */
    ariaLabel?: string
  }>(),
  {
    type: 'multiple',
    disabled: false,
    shape: 'pill',
    size: 'xs',
    orientation: 'vertical',
  },
)

const emit = defineEmits<{
  /** Fires with a colour's value each time the user selects or deselects it. */
  toggle: [value: string]
}>()

const groupLabel = inject(FILTER_GROUP_LABEL, undefined)

const selectedValues = computed(() => props.options.filter((o) => o.selected).map((o) => o.value))

function handleChange(newValues: AcceptableValue | AcceptableValue[]) {
  const raw = Array.isArray(newValues) ? newValues : [newValues]
  const values = raw.filter((v): v is string => typeof v === 'string')
  const oldSet = new Set(selectedValues.value)
  const newSet = new Set(values)
  for (const v of newSet) {
    if (!oldSet.has(v)) emit('toggle', v)
  }
  for (const v of oldSet) {
    if (!newSet.has(v)) emit('toggle', v)
  }
}
</script>

<template>
  <SwatchGroup
    :type="type"
    :shape="shape"
    :size="size"
    :orientation="orientation"
    :label-class="labelClass"
    data-slot="filter-swatch"
    :aria-label="ariaLabel ?? groupLabel"
    :model-value="selectedValues"
    :disabled="disabled"
    :class="[filterSwatch({ orientation }), orientation === 'vertical' && 'max-h-52 overflow-y-auto', props.class]"
    @update:model-value="handleChange"
  >
    <SwatchGroupItem v-for="opt in options" :key="opt.value" :value="opt.value" :hex="opt.hex" :label="opt.count === undefined ? opt.label : undefined" :disabled="opt.disabled">
      <template v-if="opt.count !== undefined" #label>
        <span class="flex flex-1 items-center justify-between gap-2">
          <span class="fui-filter-swatch-text">{{ opt.label }}</span>
          <span data-slot="filter-swatch-count" class="fui-filter-meta tabular-nums">{{ opt.count }}</span>
        </span>
      </template>
    </SwatchGroupItem>
  </SwatchGroup>
</template>

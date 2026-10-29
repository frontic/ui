<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, watch } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@library/components/ui/input-group'
import FilterField from './FilterField.vue'
import FilterFieldDescription from './FilterFieldDescription.vue'
import FilterFieldTitle from './FilterFieldTitle.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown as the filter's title, e.g. `Width`. */
    label?: string
    /** Shown as a hint below the title. */
    description?: string
    /** Shown inside both inputs, e.g. `cm` or `€`. */
    unit?: string
    /** Whether the unit sits before or after the number in each input. */
    unitPosition?: 'start' | 'end'
    /** Lowest number the inputs accept. */
    min?: number
    /** Highest number the inputs accept. */
    max?: number
    /** Amount the input arrows change the number by. */
    step?: number
    /** The current lowest and highest values; either may be left open. */
    value?: { from?: number; to?: number }
    /** Greys out both inputs so the shopper cannot change them. */
    disabled?: boolean
    /** Shown in the empty lowest-value input. */
    placeholderFrom?: string
    /** Shown in the empty highest-value input. */
    placeholderTo?: string
    /** Shown between the two inputs. */
    separator?: string
  }>(),
  {
    unitPosition: 'start',
    disabled: false,
    placeholderFrom: 'From',
    placeholderTo: 'To',
    separator: '–',
  },
)

const emit = defineEmits<{
  /** Fires with the lowest and highest numbers when the user changes either input, leaving out an empty one. */
  change: [value: { from?: number; to?: number }]
}>()

const fromValue = ref(props.value?.from !== undefined ? String(props.value.from) : '')
const toValue = ref(props.value?.to !== undefined ? String(props.value.to) : '')

watch(
  () => props.value,
  () => {
    fromValue.value = props.value?.from !== undefined ? String(props.value.from) : ''
    toValue.value = props.value?.to !== undefined ? String(props.value.to) : ''
  },
  { deep: true },
)

function handleFromChange(event: Event) {
  const input = event.target as HTMLInputElement
  const val = input.value.trim()
  fromValue.value = val
  emitChange()
}

function handleToChange(event: Event) {
  const input = event.target as HTMLInputElement
  const val = input.value.trim()
  toValue.value = val
  emitChange()
}

function emitChange() {
  const from = fromValue.value !== '' ? Number(fromValue.value) : undefined
  const to = toValue.value !== '' ? Number(toValue.value) : undefined

  if (from !== undefined && Number.isNaN(from)) return
  if (to !== undefined && Number.isNaN(to)) return

  emit('change', {
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
  })
}
</script>

<template>
  <FilterField data-slot="filter-range" :disabled="disabled" :class="['fui-filter-range', props.class]">
    <FilterFieldTitle v-if="label">
      {{ label }}
    </FilterFieldTitle>
    <FilterFieldDescription v-if="description">
      {{ description }}
    </FilterFieldDescription>
    <div class="flex items-center gap-2">
      <InputGroup class="flex-1">
        <InputGroupAddon v-if="unit && unitPosition === 'start'" align="inline-start">
          <InputGroupText>{{ unit }}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput type="number" :min="min" :max="max" :step="step" :disabled="disabled" :placeholder="placeholderFrom" :model-value="fromValue" @change="handleFromChange" />
        <InputGroupAddon v-if="unit && unitPosition === 'end'" align="inline-end">
          <InputGroupText>{{ unit }}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <span class="fui-filter-range-separator shrink-0">{{ separator }}</span>
      <InputGroup class="flex-1">
        <InputGroupAddon v-if="unit && unitPosition === 'start'" align="inline-start">
          <InputGroupText>{{ unit }}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput type="number" :min="min" :max="max" :step="step" :disabled="disabled" :placeholder="placeholderTo" :model-value="toValue" @change="handleToChange" />
        <InputGroupAddon v-if="unit && unitPosition === 'end'" align="inline-end">
          <InputGroupText>{{ unit }}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  </FilterField>
</template>

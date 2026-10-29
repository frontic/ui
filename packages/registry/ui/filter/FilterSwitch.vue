<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useId } from 'vue'
import { Switch } from '@library/components/ui/switch'
import FilterField from './FilterField.vue'
import FilterFieldContent from './FilterFieldContent.vue'
import FilterFieldDescription from './FilterFieldDescription.vue'
import FilterFieldLabel from './FilterFieldLabel.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Whether the filter is on. */
    value?: boolean
    /** Shown next to the switch, e.g. `In stock only`. */
    label: string
    /** Shown as a hint below the label. */
    description?: string
    /** Greys out the switch so the shopper cannot change it. */
    disabled?: boolean
  }>(),
  {
    value: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  /** Fires with the new on or off state when the user flips the switch. */
  change: [value: boolean]
}>()

const switchId = useId()
</script>

<template>
  <FilterField data-slot="filter-switch" orientation="horizontal" :disabled="disabled" :class="['fui-filter-switch', props.class]">
    <FilterFieldContent>
      <FilterFieldLabel :for="switchId">{{ label }}</FilterFieldLabel>
      <FilterFieldDescription v-if="description">
        {{ description }}
      </FilterFieldDescription>
    </FilterFieldContent>
    <Switch :id="switchId" :model-value="value" :disabled="disabled" @update:model-value="emit('change', $event === true)" />
  </FilterField>
</template>

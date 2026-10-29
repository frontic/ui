<script lang="ts">
/** Lets the user limit products to those with a minimum star rating. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { RatingIcon } from '@library/components/ui/rating'
import FilterField from './FilterField.vue'
import FilterFieldTitle from './FilterFieldTitle.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The selected minimum number of stars; `0` for no rating filter. */
    value?: number
    /** Shown as the filter's title, e.g. `Rating`. */
    label?: string
    /** How many stars to show. */
    max?: number
    /** Greys out the stars so the shopper cannot pick one. */
    disabled?: boolean
    /** Builds each star's screen-reader label from its star count. */
    starLabel?: (stars: number) => string
    /** Shown after the stars once a rating is selected. */
    suffix?: string
  }>(),
  {
    value: 0,
    max: 5,
    disabled: false,
    starLabel: (stars: number) => `${stars} ${stars === 1 ? 'star' : 'stars'} and up`,
    suffix: '& up',
  },
)

const emit = defineEmits<{
  /** Fires with the minimum star count the user picks, or `0` when they clear it. */
  change: [value: number]
}>()

const filledStars = computed(() => Math.max(0, Math.min(props.value, props.max)))

function handleSelect(val: AcceptableValue | AcceptableValue[]) {
  const raw = Array.isArray(val) ? val[0] : val
  const v = typeof raw === 'string' ? raw : ''
  emit('change', v ? Number(v) : 0)
}
</script>

<template>
  <FilterField data-slot="filter-rating" :disabled="disabled" :class="['fui-filter-rating', props.class]">
    <FilterFieldTitle v-if="label">
      {{ label }}
    </FilterFieldTitle>
    <ToggleGroupRoot type="single" :model-value="value > 0 ? String(value) : ''" class="flex items-center gap-1" @update:model-value="handleSelect">
      <ToggleGroupItem
        v-for="i in max"
        :key="i"
        :value="String(i)"
        :disabled="disabled"
        data-slot="filter-rating-star"
        class="fui-filter-rating-star shrink-0 cursor-pointer outline-none transition-colors focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled"
        :aria-label="starLabel(i)"
      >
        <RatingIcon size="lg" :empty="i > filledStars" />
      </ToggleGroupItem>
      <div v-if="filledStars > 0" class="ms-1.5">
        <span data-slot="filter-rating-suffix" class="fui-filter-meta">{{ suffix }}</span>
      </div>
    </ToggleGroupRoot>
  </FilterField>
</template>

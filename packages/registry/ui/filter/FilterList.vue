<script lang="ts">
/** Lists filter options with result counts that the user can toggle and search. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject, ref } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxItemIndicator, ListboxRoot, ListboxVirtualizer, useFilter } from 'reka-ui'
import { FILTER_GROUP_LABEL } from './context'

export interface FilterOption {
  option: string
  value: string
  count: number
  selected?: boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The options to list, each with its label, value, result count and selected state. */
    options: FilterOption[]
    /** Shows a search field above the list that narrows the options by label. */
    searchable?: boolean
    /** Disables every option in the list. */
    disabled?: boolean
    /** Shown in the empty search field. */
    searchPlaceholder?: string
    /** Names the list for screen readers when its title sits outside it, e.g. on an accordion trigger or a popover button; inside a FilterGroup its label is the default. */
    ariaLabel?: string
  }>(),
  {
    searchable: false,
    disabled: false,
    searchPlaceholder: 'Search...',
  },
)

const emit = defineEmits<{
  /** Fires with an option's value each time the user selects or deselects it. */
  toggle: [value: string]
}>()

const searchQuery = ref('')

const { contains } = useFilter({ sensitivity: 'base' })
const filteredOptions = computed(() => (searchQuery.value ? props.options.filter((o) => contains(o.option, searchQuery.value)) : props.options))

const selectedValues = computed(() => props.options.filter((o) => o.selected).map((o) => o.value))

function handleChange(val: AcceptableValue) {
  const newValues = (Array.isArray(val) ? val : [val]).filter((v): v is string => typeof v === 'string')
  const oldSet = new Set(selectedValues.value)
  const newSet = new Set(newValues)
  for (const v of newSet) {
    if (!oldSet.has(v)) emit('toggle', v)
  }
  for (const v of oldSet) {
    if (!newSet.has(v)) emit('toggle', v)
  }
}
const groupLabel = inject(FILTER_GROUP_LABEL, undefined)
</script>

<template>
  <ListboxRoot
    multiple
    selection-behavior="toggle"
    data-slot="filter-list"
    :model-value="selectedValues"
    :data-searchable="searchable || undefined"
    :class="['fui-filter-list-root', props.class]"
    @update:model-value="handleChange"
  >
    <ListboxFilter
      v-if="searchable"
      v-model="searchQuery"
      data-slot="filter-list-search"
      class="fui-filter-list-search w-full outline-none focus-visible:fui-focus-ring"
      :placeholder="searchPlaceholder"
    />
    <ListboxContent
      data-slot="filter-list-content"
      :aria-label="ariaLabel ?? groupLabel"
      :class="['fui-filter-list scroll-py-1 overflow-y-auto outline-none focus-visible:fui-focus-ring', !searchable && 'h-auto max-h-70']"
    >
      <ListboxVirtualizer :options="filteredOptions" :estimate-size="36" :text-content="(opt: FilterOption) => opt.option">
        <template #default="{ option: opt }">
          <ListboxItem
            :value="opt.value"
            :disabled="disabled || opt.disabled"
            data-slot="filter-list-item"
            class="fui-filter-list-item flex w-full cursor-default items-center outline-none select-none data-disabled:pointer-events-none data-disabled:fui-disabled"
          >
            <span
              data-slot="filter-list-check"
              :data-state="selectedValues.includes(opt.value) ? 'checked' : 'unchecked'"
              class="fui-filter-list-check flex shrink-0 items-center justify-center transition-colors"
            >
              <ListboxItemIndicator>
                <svg data-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </ListboxItemIndicator>
            </span>
            <span class="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span>{{ opt.option }}</span>
              <span data-slot="filter-list-count" class="fui-filter-meta tabular-nums">{{ opt.count }}</span>
            </span>
          </ListboxItem>
        </template>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, provide } from 'vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@library/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@library/components/ui/popover'
import { FILTER_GROUP_LABEL } from './context'
import FilterTrigger from './FilterTrigger.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Shown on the trigger that opens the group, e.g. `Brand` or `Size`. */
    label: string
    /** How many options in the group are active; shown on the trigger when above zero. */
    activeCount?: number
    /** Opens the options in a floating popover, or expands them inline below the trigger as in a sidebar. */
    type?: 'popover' | 'collapsible'
  }>(),
  {
    type: 'popover',
  },
)

provide(
  FILTER_GROUP_LABEL,
  computed(() => props.label),
)
</script>

<template>
  <Popover v-if="type === 'popover'">
    <PopoverTrigger as-child>
      <FilterTrigger :label="label" :active-count="activeCount" :class="props.class" />
    </PopoverTrigger>
    <PopoverContent align="start" :side-offset="4" class="fui-filter-group-content">
      <slot />
    </PopoverContent>
  </Popover>

  <Collapsible v-else>
    <CollapsibleTrigger as-child>
      <FilterTrigger :label="label" :active-count="activeCount" :class="props.class" />
    </CollapsibleTrigger>
    <CollapsibleContent class="pt-3">
      <slot />
    </CollapsibleContent>
  </Collapsible>
</template>

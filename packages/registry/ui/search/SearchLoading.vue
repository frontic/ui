<script lang="ts">
/** Skeleton rows and "Searching…" while the shop's search answers; shows only while Search is loading. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { Skeleton } from '@library/components/ui/skeleton'
import { searchContext } from './keys'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** How many skeleton rows stand in for results. */
    rows?: number
    /** Read out and shown under the rows. */
    label?: string
  }>(),
  { rows: 3, label: 'Searching…' },
)

const search = inject(searchContext)!
</script>

<template>
  <div v-if="search.loading.value" data-slot="search-loading" role="presentation" :class="['fui-search-loading', props.class]">
    <div v-for="row in props.rows" :key="row" class="fui-search-loading-row flex items-center">
      <Skeleton class="size-12 shrink-0" />
      <div class="flex flex-1 flex-col gap-2">
        <Skeleton class="h-3.5 w-2/3" />
        <Skeleton class="h-3 w-1/3" />
      </div>
    </div>
    <p role="status" class="fui-search-loading-label">{{ props.label }}</p>
  </div>
</template>

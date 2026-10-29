<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Skeleton } from '@library/components/ui/skeleton'
import { computed } from 'vue'

const props = defineProps<{
  /** Shows an icon placeholder before the text placeholder. */
  showIcon?: boolean
  class?: HTMLAttributes['class']
}>()

const width = computed(() => `${Math.floor(Math.random() * 40) + 50}%`)
</script>

<template>
  <div data-slot="sidebar-menu-skeleton" data-sidebar="menu-skeleton" :class="['fui-sidebar-menu-skeleton', props.class]">
    <Skeleton v-if="showIcon" class="size-3.5 rounded-none" data-sidebar="menu-skeleton-icon" />
    <Skeleton class="h-4 flex-1" data-sidebar="menu-skeleton-text" :style="{ maxWidth: width }" />
  </div>
</template>

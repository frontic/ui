<script lang="ts">
/** Shows a placeholder for content that is still loading. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

interface SkeletonProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div data-slot="skeleton" :class="['fui-skeleton animate-pulse motion-reduce:animate-none', props.class]" />
</template>

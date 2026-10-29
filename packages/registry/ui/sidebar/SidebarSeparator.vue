<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Separator } from '@library/components/ui/separator'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Separator data-slot="sidebar-separator" data-sidebar="separator" :class="['fui-sidebar-separator', props.class]">
    <slot />
  </Separator>
</template>

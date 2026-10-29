<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Separator } from '@library/components/ui/separator'

const props = defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Separator data-slot="item-separator" orientation="horizontal" :class="['fui-item-separator', props.class]" />
</template>

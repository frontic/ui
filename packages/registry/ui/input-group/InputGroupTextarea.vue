<script lang="ts">
/** Lets the user enter several lines of text inside the group. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Textarea } from '@library/components/ui/textarea'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Textarea data-slot="input-group-control" :class="['fui-input-group-textarea resize-none border-0 focus-visible:border-b-0 bg-transparent', props.class]" />
</template>

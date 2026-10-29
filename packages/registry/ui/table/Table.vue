<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

// A table wider than its box can only be scrolled from the keyboard once the box takes focus.
const container = useTemplateRef<HTMLElement>('container')
const scrolls = ref(false)
const name = ref<string>()
useResizeObserver([container, () => container.value?.firstElementChild as HTMLElement | undefined], () => {
  const box = container.value
  if (!box) return
  scrolls.value = box.scrollWidth > box.clientWidth
  name.value = box.querySelector('caption')?.textContent?.trim() || undefined
})
</script>

<template>
  <div
    ref="container"
    data-slot="table-container"
    :tabindex="scrolls ? 0 : undefined"
    :role="scrolls ? 'region' : undefined"
    :aria-label="scrolls ? name : undefined"
    class="relative w-full overflow-x-auto outline-none focus-visible:fui-focus-ring"
  >
    <table data-slot="table" :class="['fui-table caption-bottom', props.class]">
      <slot />
    </table>
  </div>
</template>

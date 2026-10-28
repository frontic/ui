<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows one dot per slide and lets the user jump to a slide. */
export default {}
</script>

<script setup lang="ts">
import type { WithClassAsProps } from './interface'
import { Button } from '@library/components/ui/button'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useCarousel } from './useCarousel'

const props = withDefaults(
  defineProps<
    WithClassAsProps & {
      /** Builds each dot's screen-reader label from its 1-based slide number. */
      label?: (slide: number) => string
    }
  >(),
  {
    label: (slide: number) => `Go to slide ${slide}`,
  },
)

const { carouselApi, scrollTo } = useCarousel()
const snapCount = ref(0)
const activeIndex = ref(0)

let cleanup: (() => void) | undefined

watch(
  () => carouselApi.value,
  (api) => {
    cleanup?.()
    cleanup = undefined
    if (!api) return
    const update = () => {
      snapCount.value = api.snapList().length
      activeIndex.value = api.selectedSnap()
    }
    update()
    api.on('select', update)
    api.on('reinit', update)
    cleanup = () => {
      api.off('select', update)
      api.off('reinit', update)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div v-if="snapCount > 0" data-slot="carousel-dots" :class="['fui-carousel-dots absolute bottom-0 left-1/2 -translate-x-1/2', props.class]">
    <Button
      v-for="index in snapCount"
      :key="index"
      variant="ghost"
      color="neutral"
      size="icon-md"
      :aria-label="props.label(index)"
      :aria-current="activeIndex === index - 1"
      @click="scrollTo(index - 1)"
    >
      <span data-slot="carousel-dot" :data-selected="activeIndex === index - 1" class="fui-carousel-dot opacity-90" />
    </Button>
  </div>
</template>

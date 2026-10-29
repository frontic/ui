<script setup lang="ts">
import type { WithClassAsProps } from './interface'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useCarousel } from './useCarousel'

const props = defineProps<WithClassAsProps>()

const { carouselApi, dir, orientation } = useCarousel()

const progress = ref(0)

let cleanup: (() => void) | undefined

watch(
  () => carouselApi.value,
  (api) => {
    cleanup?.()
    if (!api) return

    const updateProgress = () => {
      if (!api) return

      // The bar starts filled by the share of the slides in view, so it reaches the end with the last slide.
      const size = orientation === 'vertical' ? 'height' : 'width'
      const content = api.slideNodes().reduce((sum, slide) => sum + slide.getBoundingClientRect()[size], 0)
      const share = content ? Math.min(api.rootNode().getBoundingClientRect()[size] / content, 1) : 1
      const adjustedProgress = share + api.scrollProgress() * (1 - share)

      progress.value = Math.max(0, Math.min(1, adjustedProgress))
    }

    api.on('reinit', updateProgress)
    api.on('scroll', updateProgress)
    api.on('slidefocus', updateProgress)
    api.on('resize', updateProgress)

    cleanup = () => {
      api.off('reinit', updateProgress)
      api.off('scroll', updateProgress)
      api.off('slidefocus', updateProgress)
      api.off('resize', updateProgress)
    }

    updateProgress()
  },
  { immediate: true },
)

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div data-slot="carousel-progress" :class="['fui-carousel-progress overflow-hidden', props.class]">
    <div
      data-slot="carousel-progress-indicator"
      class="fui-carousel-progress-indicator h-full w-full transition-transform duration-100 ease-out"
      :style="{
        transform: `translate3d(${(progress - 1) * (dir === 'rtl' ? -100 : 100)}%,0px,0px)`,
      }"
    />
  </div>
</template>

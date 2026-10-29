<script setup lang="ts">
import type { CarouselButtonProps, WithClassAsProps } from './interface'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { useCarousel } from './useCarousel'

const props = withDefaults(
  defineProps<
    CarouselButtonProps &
      WithClassAsProps & {
        /** Screen-reader text of the button that scrolls to the previous slide. */
        label?: string
      }
  >(),
  {
    variant: 'outline',
    color: 'neutral',
    size: 'icon-sm',
    label: 'Previous slide',
  },
)

const { orientation, canScrollPrev, scrollPrev } = useCarousel()
</script>

<template>
  <Button
    data-slot="carousel-previous"
    :disabled="!canScrollPrev"
    :class="['absolute touch-manipulation', orientation === 'horizontal' ? 'top-1/2 -inset-s-12 -translate-y-1/2' : '-top-12 left-1/2 -translate-x-1/2 rotate-90', props.class]"
    :variant="props.variant"
    :color="props.color"
    :size="props.size"
    @click="scrollPrev"
  >
    <slot>
      <IconPlaceholder
        lucide="ChevronLeftIcon"
        tabler="IconChevronLeft"
        hugeicons="ArrowLeft01Icon"
        phosphor="CaretLeftIcon"
        remixicon="RiArrowLeftSLine"
        :class="orientation === 'horizontal' && 'rtl:-scale-x-100'"
        data-icon
      />
      <span class="sr-only">{{ props.label }}</span>
    </slot>
  </Button>
</template>

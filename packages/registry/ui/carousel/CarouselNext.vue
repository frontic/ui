<script lang="ts">
/** Lets the user scroll the carousel to the next slide. */
export default {}
</script>

<script setup lang="ts">
import type { CarouselButtonProps, WithClassAsProps } from './interface'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { useCarousel } from './useCarousel'

const props = withDefaults(
  defineProps<
    CarouselButtonProps &
      WithClassAsProps & {
        /** Screen-reader text of the button that scrolls to the next slide. */
        label?: string
      }
  >(),
  {
    variant: 'outline',
    color: 'neutral',
    size: 'icon-sm',
    label: 'Next slide',
  },
)

const { orientation, canScrollNext, scrollNext } = useCarousel()
</script>

<template>
  <Button
    data-slot="carousel-next"
    :disabled="!canScrollNext"
    :class="['absolute touch-manipulation', orientation === 'horizontal' ? 'top-1/2 -inset-e-12 -translate-y-1/2' : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90', props.class]"
    :variant="props.variant"
    :color="props.color"
    :size="props.size"
    @click="scrollNext"
  >
    <slot>
      <IconPlaceholder
        lucide="ChevronRightIcon"
        tabler="IconChevronRight"
        hugeicons="ArrowRight01Icon"
        phosphor="CaretRightIcon"
        remixicon="RiArrowRightSLine"
        :class="orientation === 'horizontal' && 'rtl:-scale-x-100'"
        data-icon
      />
      <span class="sr-only">{{ props.label }}</span>
    </slot>
  </Button>
</template>

<script lang="ts">
/** Groups all parts of the carousel, which scrolls through items sideways. */
export default {}
</script>

<script setup lang="ts">
import type { CarouselEmits, CarouselProps, UnwrapRefCarouselApi, WithClassAsProps } from './interface'
import { useProvideCarousel } from './useCarousel'

const props = withDefaults(
  defineProps<
    CarouselProps &
      WithClassAsProps & {
        /** Screen-reader name for the kind of region, announced as e.g. `carousel`. */
        roleDescription?: string
      }
  >(),
  {
    orientation: 'horizontal',
    roleDescription: 'carousel',
  },
)

const emits = defineEmits<CarouselEmits>()

defineSlots<{
  /** Holds the carousel's content and buttons; gets the Embla API and element, the orientation, whether it can scroll either way, and functions that scroll it. */
  default?: (props: {
    canScrollNext: boolean
    canScrollPrev: boolean
    carouselApi: UnwrapRefCarouselApi
    carouselRef: HTMLElement | undefined
    orientation: CarouselProps['orientation']
    scrollNext: () => void
    scrollPrev: () => void
  }) => unknown
}>()

const { canScrollNext, canScrollPrev, carouselApi, carouselRef, dir, orientation, scrollNext, scrollPrev } = useProvideCarousel(props, emits)

defineExpose({
  canScrollNext,
  canScrollPrev,
  carouselApi,
  carouselRef,
  orientation,
  scrollNext,
  scrollPrev,
})

function onKeyDown(event: KeyboardEvent) {
  const rtl = dir.value === 'rtl'
  const prevKey = props.orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'

  if (event.key === prevKey) {
    event.preventDefault()
    scrollPrev()

    return
  }

  if (event.key === nextKey) {
    event.preventDefault()
    scrollNext()
  }
}
</script>

<template>
  <div
    data-slot="carousel"
    :class="['relative outline-none focus-visible:fui-focus-ring', props.class]"
    role="region"
    :aria-roledescription="props.roleDescription"
    :dir="dir"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <slot :can-scroll-next :can-scroll-prev :carousel-api :carousel-ref :orientation :scroll-next :scroll-prev />
  </div>
</template>

import type { UnwrapRefCarouselApi as CarouselApi, CarouselEmits, CarouselProps } from './interface'
import { createInjectionState } from '@vueuse/core'
import useEmblaCarousel from 'embla-carousel-vue'
import { useDirection } from 'reka-ui'
import type { EmitFn } from 'vue'
import { ref, shallowRef, watch } from 'vue'

const [useProvideCarousel, useInjectCarousel] = createInjectionState((props: CarouselProps, emits: EmitFn<CarouselEmits>) => {
  const { orientation, plugins } = props
  const dir = useDirection()
  const [emblaNode, emblaApi] = useEmblaCarousel(
    () => ({
      ...props.opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
      direction: dir.value,
    }),
    plugins,
  )

  function scrollPrev() {
    emblaApi.value?.goToPrev()
  }
  function scrollNext() {
    emblaApi.value?.goToNext()
  }
  function scrollTo(index: number) {
    emblaApi.value?.goTo(index)
  }

  const canScrollNext = ref(false)
  const canScrollPrev = ref(false)
  const slides = shallowRef<HTMLElement[]>([])

  function onSelect(api: NonNullable<CarouselApi>) {
    canScrollNext.value = api.canGoToNext()
    canScrollPrev.value = api.canGoToPrev()
    slides.value = api.slideNodes()
  }

  // Embla creates its API once the viewport mounts, after this component's own mounted hook.
  watch(
    emblaApi,
    (api) => {
      if (!api) return
      onSelect(api)
      api.on('select', onSelect)
      api.on('reinit', onSelect)
      emits('init-api', api)
    },
    { immediate: true },
  )

  return { carouselRef: emblaNode, carouselApi: emblaApi, dir, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo, orientation, slides }
})

function useCarousel() {
  const carouselState = useInjectCarousel()

  if (!carouselState) throw new Error('useCarousel must be used within a <Carousel />')

  return carouselState
}

export { useCarousel, useProvideCarousel }

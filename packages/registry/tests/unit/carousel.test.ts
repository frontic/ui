// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from 'reka-ui'
import { createApp, h, nextTick, shallowRef, toValue } from 'vue'

const box = (width: number) => ({ getBoundingClientRect: () => ({ width, height: 0 }) })
const api = {
  canGoToNext: () => true,
  canGoToPrev: () => false,
  on: vi.fn(),
  off: vi.fn(),
  goToNext: vi.fn(),
  goToPrev: vi.fn(),
  goTo: vi.fn(),
  slideNodes: (): unknown[] => [...document.querySelectorAll('[data-slot="carousel-item"]')],
  rootNode: () => box(200),
  scrollProgress: () => 0,
  snapList: () => [0, 1, 2, 3, 4, 5],
  selectedSnap: () => 0,
}
const apiRef = shallowRef<typeof api>()
let emblaOptions: unknown
vi.mock('embla-carousel-vue', () => ({
  default: (options: unknown) => {
    emblaOptions = options
    return [shallowRef(), apiRef, api]
  },
}))

const { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselProgress } = await import('../../ui/carousel')

let app: ReturnType<typeof createApp> | undefined
afterEach(() => {
  app?.unmount()
  apiRef.value = undefined
  api.slideNodes = () => [...document.querySelectorAll('[data-slot="carousel-item"]')]
})
const mountWithApi = async (children: () => unknown[]) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Carousel, null, children) })
  app.mount('#app')
  await nextTick()
  apiRef.value = api
  await nextTick()
}

describe('a Carousel', () => {
  it('reads its scroll state once Embla hands over its API, which happens after the carousel mounts', async () => {
    const inits: unknown[] = []
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () => h(Carousel, { onInitApi: (a: unknown) => inits.push(a) }, () => [h(CarouselContent, () => [h(CarouselItem, () => 'A')]), h(CarouselPrevious), h(CarouselNext)]),
    })
    app.mount('#app')
    await nextTick()
    apiRef.value = api
    await nextTick()
    expect((document.querySelector('[data-slot="carousel-next"]') as HTMLButtonElement).disabled).toBe(false)
    expect((document.querySelector('[data-slot="carousel-previous"]') as HTMLButtonElement).disabled).toBe(true)
    expect(inits).toEqual([api])
    ;(document.querySelector('[data-slot="carousel-next"]') as HTMLButtonElement).click()
    expect(api.goToNext).toHaveBeenCalled()
  })

  it('lets the page scroll across its track and pinch-zoom it', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Carousel, () => h(CarouselContent)) })
    app.mount('#app')
    await nextTick()
    const track = document.querySelector('[data-slot="carousel-content"] > div')!
    expect([...track.classList]).toEqual(expect.arrayContaining(['touch-pan-y', 'touch-pinch-zoom']))
  })

  it('labels each slide with its position among all slides', async () => {
    await mountWithApi(() => [h(CarouselContent, () => ['A', 'B', 'C'].map((text) => h(CarouselItem, () => text)))])
    expect([...document.querySelectorAll('[data-slot="carousel-item"]')].map((item) => item.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
  })

  it('starts its progress bar filled by the share of the slides in view', async () => {
    api.slideNodes = () => Array.from({ length: 6 }, () => box(100))
    await mountWithApi(() => [h(CarouselContent), h(CarouselProgress)])
    expect((document.querySelector('[data-slot="carousel-progress-indicator"]') as HTMLElement).style.transform).toBe('translate3d(-66.66666666666667%,0px,0px)')
  })
})

describe('a Carousel in a right-to-left ConfigProvider', () => {
  const mountRtl = async (children: () => unknown[]) => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(ConfigProvider, { dir: 'rtl' }, () => h(Carousel, { opts: { align: 'start' } }, children)) })
    app.mount('#app')
    await nextTick()
    apiRef.value = api
    await nextTick()
  }

  it('runs Embla right-to-left and lays its track out right-to-left', async () => {
    await mountRtl(() => [h(CarouselContent, () => [h(CarouselItem, () => 'A')])])
    expect(toValue(emblaOptions as () => object)).toEqual({ align: 'start', axis: 'x', direction: 'rtl' })
    expect(document.querySelector('[data-slot="carousel"]')!.getAttribute('dir')).toBe('rtl')
  })

  it('moves to the next slide on the left arrow, the way the slides run', async () => {
    api.goToNext.mockClear()
    api.goToPrev.mockClear()
    await mountRtl(() => [h(CarouselContent, () => [h(CarouselItem, () => 'A')])])
    const root = document.querySelector('[data-slot="carousel"]')!
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(api.goToNext).toHaveBeenCalledOnce()
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(api.goToPrev).toHaveBeenCalledOnce()
  })

  it('mirrors its chevrons only when horizontal; a vertical carousel turns them, whichever way the page reads', async () => {
    const mirrored = () => ['previous', 'next'].map((part) => document.querySelector(`[data-slot="carousel-${part}"] [data-icon]`)!.getAttribute('class')?.includes('rtl:-scale-x-100') ?? false)
    await mountRtl(() => [h(CarouselContent), h(CarouselPrevious), h(CarouselNext)])
    expect(mirrored()).toEqual([true, true])
    app!.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(ConfigProvider, { dir: 'rtl' }, () => h(Carousel, { orientation: 'vertical' }, () => [h(CarouselContent), h(CarouselPrevious), h(CarouselNext)])) })
    app.mount('#app')
    await nextTick()
    expect(mirrored()).toEqual([false, false])
  })

  it('fills its progress bar from the right', async () => {
    api.slideNodes = () => [box(400)]
    await mountRtl(() => [h(CarouselContent, () => [h(CarouselItem, () => 'A')]), h(CarouselProgress)])
    const indicator = document.querySelector('[data-slot="carousel-progress-indicator"]') as HTMLElement
    expect(indicator.style.transform).toMatch(/^translate3d\(50%/)
  })
})

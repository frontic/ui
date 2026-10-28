import { describe, expect, it, vi } from 'vitest'
import { h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import CarouselDots from '../../ui/carousel/CarouselDots.vue'

vi.mock('../../ui/carousel/useCarousel', () => ({
  useCarousel: () => ({ carouselApi: ref({ snapList: () => [0, 1, 2], selectedSnap: () => 0, on: () => {}, off: () => {} }), scrollTo: () => {} }),
}))

describe('carousel dots', () => {
  it('label each dot with its slide number', async () => {
    const html = await renderToString(h(CarouselDots))
    expect(html).toContain('aria-label="Go to slide 1"')
    expect(html).toContain('aria-label="Go to slide 3"')
  })

  it('take a passed label function', async () => {
    expect(await renderToString(h(CarouselDots, { label: (slide: number) => `Folie ${slide}` }))).toContain('aria-label="Folie 2"')
  })
})

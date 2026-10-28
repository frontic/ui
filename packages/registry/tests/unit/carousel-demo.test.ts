// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import CarouselDemo from '../../ui/carousel/carousel.example.vue'

it('shows how far the jacket slider has scrolled with a progress bar under it', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(CarouselDemo))
  app.mount('#app')
  await nextTick()
  const carousel = document.querySelector('[data-slot="carousel"]')!
  const progress = carousel.querySelector('[data-slot="carousel-progress"]')!
  expect(progress).not.toBeNull()
  expect(carousel.querySelector('[data-slot="carousel-content"]')!.compareDocumentPosition(progress) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  app.unmount()
})

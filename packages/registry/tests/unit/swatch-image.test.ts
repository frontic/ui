// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { SwatchFallback, SwatchImage, SwatchRoot } from '../../ui/swatch'

/** An image that loads any src but one naming "broken", a tick after it is set. */
class FakeImage extends EventTarget {
  onload: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  complete = false
  naturalWidth = 0
  #src = ''
  get src() {
    return this.#src
  }
  set src(value: string) {
    this.#src = value
    setTimeout(() => {
      const ok = !value.includes('broken')
      this.complete = ok
      this.naturalWidth = ok ? 10 : 0
      const event = new Event(ok ? 'load' : 'error')
      this.dispatchEvent(event)
      ;(ok ? this.onload : this.onerror)?.(event)
    })
  }
}

let app: ReturnType<typeof createApp> | undefined
beforeEach(() => vi.stubGlobal('Image', FakeImage))
afterEach(() => {
  app?.unmount()
  vi.unstubAllGlobals()
})
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
}
const mount = async (src: string) => {
  const statuses: string[] = []
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(SwatchRoot, null, () => [h(SwatchImage, { src, onLoadingStatusChange: (s: string) => statuses.push(s) }), h(SwatchFallback, null, () => 'F')]) })
  app.mount('#app')
  await settle()
  return statuses
}

describe('a swatch image', () => {
  it('reports loading, then loaded, and hides the fallback', async () => {
    const statuses = await mount('/merino.jpg')
    expect(statuses.at(-1)).toBe('loaded')
    expect(statuses).toContain('loading')
    expect(document.querySelector<HTMLElement>('[data-slot=swatch-image]')!.style.display).toBe('')
    expect(document.body.textContent).not.toContain('F')
  })

  it('reports an error and keeps the fallback when the image fails', async () => {
    expect((await mount('/broken.jpg')).at(-1)).toBe('error')
    expect(document.body.textContent).toContain('F')
  })
})

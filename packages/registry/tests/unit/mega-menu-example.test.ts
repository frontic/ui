// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import MegaMenuDemo from '../../ui/mega-menu/mega-menu.example.vue'

let app: ReturnType<typeof createApp> | undefined
beforeEach(() => {
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(640)
})
afterEach(() => {
  app?.unmount()
  vi.restoreAllMocks()
})

describe('the mega menu example', () => {
  it('names its featured product once, by the caption, not again by the image', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(MegaMenuDemo) })
    app.mount('#app')
    await nextTick()
    await nextTick()
    const featured = [...document.querySelectorAll('a')].find((link) => link.querySelector('img'))!
    expect(featured.textContent!.trim()).toBe('Winterwonder Parka')
    expect(featured.querySelector('img')!.getAttribute('alt')).toBe('')
  })
})

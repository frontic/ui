// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { AspectRatio } from '../../ui/aspect-ratio'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('an AspectRatio', () => {
  it('clips its content to the radius its recipe gives it, and takes a passed class', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(AspectRatio, { ratio: 2, class: 'shadow-none' }, () => h('img')) })
    app.mount('#app')
    await nextTick()
    const box = document.querySelector('[data-slot="aspect-ratio"]')!
    expect([...box.classList]).toEqual(['fui-aspect-ratio', 'overflow-hidden', 'shadow-none'])
    expect(box.parentElement!.style.paddingBottom).toBe('50%')
  })
})

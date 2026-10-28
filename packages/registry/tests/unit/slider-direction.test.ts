// @vitest-environment happy-dom
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterPrice } from '../../ui/filter'
import { Slider } from '../../ui/slider'

let app: ReturnType<typeof createApp> | undefined
const mount = async (dir: 'ltr' | 'rtl', render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(ConfigProvider, { dir }, render) })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const root = () => document.querySelector<HTMLElement>('[data-slot="slider-root"]')!
// Reka places each thumb from the slider's start edge.
const startEdge = () => (document.querySelector<HTMLElement>('[role="slider"]')!.style.right ? 'right' : 'left')
afterEach(() => {
  app?.unmount()
})

describe('the slider under a right-to-left ConfigProvider', () => {
  it('runs from the right, so its minimum sits where the reader starts', async () => {
    await mount('rtl', () => h(Slider, { defaultValue: [20, 80] }))
    expect(root().getAttribute('dir')).toBe('rtl')
    expect(startEdge()).toBe('right')
  })

  it('keeps the direction a nearer ConfigProvider gives', async () => {
    await mount('rtl', () => h(ConfigProvider, { dir: 'ltr' }, () => h(Slider, { defaultValue: [20, 80] })))
    expect(root().getAttribute('dir')).toBe('ltr')
  })

  it('keeps the direction its own prop gives', async () => {
    await mount('rtl', () => h(Slider, { defaultValue: [20, 80], dir: 'ltr' }))
    expect(root().getAttribute('dir')).toBe('ltr')
  })

  it('carries FilterPrice, whose readout puts the lower price first for the reader', async () => {
    await mount('rtl', () => h(FilterPrice, { min: 0, max: 200, value: { from: 50, to: 150 } }))
    expect(root().getAttribute('dir')).toBe('rtl')
    expect(startEdge()).toBe('right')
  })
})

describe('the slider under a left-to-right ConfigProvider', () => {
  it('runs from the left', async () => {
    await mount('ltr', () => h(Slider, { defaultValue: [20, 80] }))
    expect(root().getAttribute('dir')).toBe('ltr')
    expect(startEdge()).toBe('left')
  })
})

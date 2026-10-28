// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ScrollArea } from '../../ui/scroll-area'
import Demo from '../../ui/scroll-area/scroll-area.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())
const bars = () => [...document.querySelectorAll<HTMLElement>('[data-slot="scroll-area-scrollbar"]')]

describe('a ScrollArea', () => {
  it('draws a vertical bar by default, beside the viewport', async () => {
    await mount(() => h(ScrollArea, { type: 'always' }, () => 'Content'))
    expect(bars().map((bar) => bar.dataset.orientation)).toEqual(['vertical'])
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')!.contains(bars()[0]!)).toBe(false)
  })

  it('draws the bars its orientation asks for', async () => {
    await mount(() => h(ScrollArea, { type: 'always', orientation: 'horizontal' }, () => 'Content'))
    expect(bars().map((bar) => bar.dataset.orientation)).toEqual(['horizontal'])
    app!.unmount()
    await mount(() => h(ScrollArea, { type: 'always', orientation: 'both' }, () => 'Content'))
    expect(bars().map((bar) => bar.dataset.orientation)).toEqual(['vertical', 'horizontal'])
  })

  it('sizes its bars through the scrollbar recipe', async () => {
    await mount(() => h(ScrollArea, { type: 'always', orientation: 'both' }, () => 'Content'))
    expect(bars().map((bar) => [...bar.classList].filter((c) => c.startsWith('fui-')))).toEqual([
      ['fui-scroll-area-scrollbar', 'fui-scroll-area-scrollbar-vertical'],
      ['fui-scroll-area-scrollbar', 'fui-scroll-area-scrollbar-horizontal'],
    ])
    expect(bars().some((bar) => /\b(?:[wh]|p[xytrblse]?)-(?:\d|px)/.test(bar.className))).toBe(false)
  })

  it('lets the keyboard reach the viewport', async () => {
    await mount(() => h(ScrollArea, null, () => 'Content'))
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')!.getAttribute('tabindex')).toBe('0')
  })

  it('demo scrolls catalog products along the orientation it is given', async () => {
    await mount(() => h(Demo, { orientation: 'horizontal', type: 'always' }))
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')!.textContent).toContain('Frost Escape Parka')
    expect(bars().map((bar) => bar.dataset.orientation)).toEqual(['horizontal'])
  })
})

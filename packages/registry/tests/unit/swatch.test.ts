// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Swatch } from '../../ui/swatch'
import SwatchGroupDemo from '../../ui/swatch-group/swatch-group.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const swatches = () => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="swatch-group-item"]')]
const nameOf = (button: HTMLElement) => button.closest('label')!.textContent!.replace(/\s+/g, ' ').trim()

describe('a swatch', () => {
  it('fills with its colour when it has no image', async () => {
    await mount(() => h(Swatch, { hex: '#3d3347', label: 'Aubergine' }))
    expect(document.querySelector<HTMLElement>('[data-slot="swatch-fallback"]')!.style.backgroundColor).toBe('#3d3347')
  })

  it('wears no hover wash over its colour', async () => {
    await mount(() => h(Swatch, { hex: '#3d3347', label: 'Aubergine' }))
    expect(document.querySelector('[data-slot="swatch-overlay"]')).toBeNull()
  })

  it('is struck through when unavailable and says so after its name', async () => {
    await mount(() => [h(Swatch, { hex: '#dc967b', label: 'Salmon', unavailable: true }), h(Swatch, { hex: '#3d3347', label: 'Aubergine' })])
    const [salmon, aubergine] = [...document.querySelectorAll<HTMLElement>('[data-slot="swatch"]')]
    expect(salmon!.hasAttribute('data-unavailable')).toBe(true)
    expect(salmon!.querySelector('[data-slot="swatch-strike"]')!.getAttribute('aria-hidden')).toBe('true')
    expect(nameOf(salmon!)).toBe('Salmon, Unavailable')
    expect([aubergine!.hasAttribute('data-unavailable'), aubergine!.querySelector('[data-slot="swatch-strike"]'), nameOf(aubergine!)]).toEqual([false, null, 'Aubergine'])
  })
})

describe('the swatch group demo', () => {
  it('is a named colour choice with Aubergine chosen and Salmon sold out but still selectable', async () => {
    await mount(() => h(SwatchGroupDemo))
    expect(document.querySelector('[data-slot="swatch-group"]')!.getAttribute('aria-label')).toBe('Colour')
    expect(swatches().map(nameOf)).toEqual(['Aubergine', 'Dusty rose', 'Salmon, Sold out'])
    expect(swatches().map((s) => s.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false'])
    swatches()[2]!.click()
    await nextTick()
    expect(swatches().map((s) => s.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true'])
  })
})

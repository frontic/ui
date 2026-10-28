// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Toggle } from '../../ui/toggle'
import ToggleDemo from '../../ui/toggle/toggle.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const classes = () => document.querySelector('[data-slot="toggle"]')!.getAttribute('class')!.split(' ')

describe('a toggle', () => {
  it('wears the shared focus ring', async () => {
    await mount(() => h(Toggle, () => 'Sale'))
    expect(classes()).toContain('focus-visible:fui-focus-ring')
  })

  it('squares itself in the icon sizes', async () => {
    await mount(() => h(Toggle, { size: 'icon-md' }, () => 'x'))
    expect(classes()).toContain('fui-toggle-icon-md')
  })
})

describe('the toggle demo', () => {
  it('is a square, outlined wishlist heart that fills while pressed', async () => {
    await mount(() => h(ToggleDemo))
    const toggle = document.querySelector<HTMLButtonElement>('[data-slot="toggle"]')!
    const filled = () => toggle.querySelector('svg')!.getAttribute('class')?.includes('fill-current') ?? false
    expect([toggle.getAttribute('aria-label'), classes().includes('fui-toggle-outline'), classes().includes('fui-toggle-icon-md')]).toEqual(['Save to wishlist', true, true])
    expect([toggle.getAttribute('aria-pressed'), filled()]).toEqual(['false', false])
    toggle.click()
    await nextTick()
    expect([toggle.getAttribute('aria-pressed'), filled()]).toEqual(['true', true])
  })
})

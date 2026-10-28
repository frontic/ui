// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Switch } from '../../ui/switch'
import SwitchDemo from '../../ui/switch/switch.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const classes = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!.getAttribute('class')!.split(' ')

describe('a switch', () => {
  it('lays its thumb out left to right and mirrors as a whole in a right-to-left page, keeping the thumb content upright', async () => {
    await mount(() => h(Switch))
    expect(document.querySelector('[data-slot="switch"]')!.getAttribute('dir')).toBe('ltr')
    expect(classes('switch')).toContain('rtl:-scale-x-100')
    expect(classes('switch-thumb')).toContain('rtl:-scale-x-100')
  })
})

describe('the switch demo', () => {
  it('is an order-updates setting named by its Field label, off until pressed', async () => {
    await mount(() => h(SwitchDemo))
    const control = document.querySelector<HTMLButtonElement>('[data-slot="switch"]')!
    const label = document.getElementById(control.getAttribute('aria-labelledby')!)!
    expect([control.getAttribute('role'), label.textContent, control.getAttribute('aria-checked')]).toEqual(['switch', 'Order updates', 'false'])
    control.click()
    await nextTick()
    expect(control.getAttribute('aria-checked')).toBe('true')
  })
})

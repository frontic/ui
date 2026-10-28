// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
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

  it('keeps a touch area of at least 24px each way that never reaches past its sides, so a switch at an edge adds no scroll', async () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const px = (token: string) => Number(/\{spacing\.([\d.]+)\}/.exec(token)![1]) * 4
    await mount(() => h(Switch))
    const inset = (axis: 'x' | 'y') => {
      const step = classes('switch').find((cls) => cls.startsWith(`after:-inset-${axis}-`))
      return step ? Number(step.slice(`after:-inset-${axis}-`.length)) * 4 : 0
    }
    expect(inset('x')).toBe(0)
    const sizes = trees.switch!.variants!.size as Record<string, { width: string; height: string }>
    // WCAG 2.5.8 asks 24 by 24: the switch is that wide already, the touch area only adds height.
    const touch = Object.entries(sizes).map(([size, { width, height }]) => [size, px(width) + 2 * inset('x'), px(height) + 2 * inset('y')])
    expect(touch).toEqual([
      ['md', 33, 34],
      ['sm', 25, 30],
    ])
  })
})

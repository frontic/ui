// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group'
import ToggleGroupDemo from '../../ui/toggle-group/toggle-group.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const classes = (selector: string) => [...document.querySelectorAll(selector)].map((e) => e.getAttribute('class')!.split(' '))

describe('a joined toggle group', () => {
  it.each(['horizontal', 'vertical'] as const)('overlaps its %s items by their border and raises a pressed one, so its whole outline shows', async (orientation) => {
    await mount(() => h(ToggleGroup, { type: 'multiple', orientation, defaultValue: ['b'] }, () => ['a', 'b', 'c'].map((value) => h(ToggleGroupItem, { value }, () => value))))
    const [root] = classes('[data-slot=toggle-group]')
    expect(root).toEqual(expect.arrayContaining(['data-join-x:*:not-first:-ms-px', 'data-join-y:*:not-first:-mt-px']))
    expect(document.querySelector('[data-slot=toggle-group]')!.hasAttribute(orientation === 'vertical' ? 'data-join-y' : 'data-join-x')).toBe(true)
    for (const item of classes('[data-slot=toggle-group-item]')) {
      expect(item.filter((c) => /border-[st]-0$/.test(c))).toEqual([])
      expect(item).toEqual(expect.arrayContaining(['aria-pressed:z-10', 'hover:z-5']))
    }
  })
})

describe('the toggle group demo', () => {
  it('filters jackets by several features at once, two of them pressed', async () => {
    await mount(() => h(ToggleGroupDemo))
    const group = document.querySelector('[data-slot=toggle-group]')!
    expect(group.getAttribute('aria-label')).toBe('Jacket features')
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot=toggle-group-item]')]
    expect(items.map((item) => [item.textContent, item.dataset.state])).toEqual([
      ['Waterproof', 'on'],
      ['Insulated', 'on'],
      ['Packable', 'off'],
    ])
  })
})

// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Separator } from '../../ui/separator'
import Demo from '../../ui/separator/separator.example.vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())
const line = () => document.querySelector<HTMLElement>('[data-slot="separator"]')!

describe('a Separator', () => {
  it('draws a horizontal line by default, hidden from screen readers', async () => {
    await mount(() => h(Separator))
    expect([...line().classList].filter((c) => c.startsWith('fui-'))).toEqual(['fui-separator', 'fui-separator-horizontal'])
    expect(line().getAttribute('role')).toBe('none')
  })

  it('stands upright when vertical', async () => {
    await mount(() => h(Separator, { orientation: 'vertical' }))
    expect(line().classList.contains('fui-separator-vertical')).toBe(true)
    expect(readRegistryRecipes(join(import.meta.dirname, '../..')).trees.separator!.variants!.orientation!.vertical).toMatchObject({ alignSelf: 'stretch' })
  })

  it('announces itself when it is not decorative', async () => {
    await mount(() => h(Separator, { decorative: false, orientation: 'vertical' }))
    expect(line().getAttribute('role')).toBe('separator')
    expect(line().getAttribute('aria-orientation')).toBe('vertical')
  })

  it('demo divides a product from its service links', async () => {
    await mount(() => h(Demo))
    expect(document.body.textContent).toContain('Frost Escape Parka')
    expect(document.querySelectorAll('[data-slot="separator"]')).toHaveLength(3)
  })
})

// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { MegaMenu, MegaMenuContent, MegaMenuItem, MegaMenuLink, MegaMenuList, MegaMenuTrigger, MegaMenuViewport } from '../../ui/mega-menu'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const mount = async (trigger: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({
    render: () =>
      h(MegaMenu, { defaultValue: 'women' }, () => [
        h(MegaMenuList, null, () =>
          h(MegaMenuItem, { value: 'women' }, () => [h(MegaMenuTrigger, trigger, () => 'Women'), h(MegaMenuContent, null, () => h(MegaMenuLink, { href: '#' }, () => 'Jackets'))]),
        ),
        h(MegaMenuViewport),
      ]),
  })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const $ = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!

describe('a mega menu', () => {
  it('shows a chevron after each trigger’s label, or none when asked', async () => {
    await mount()
    expect($('mega-menu-trigger').querySelector('[data-icon]')).not.toBeNull()
    await mount({ chevron: false })
    expect($('mega-menu-trigger').querySelector('[data-icon]')).toBeNull()
  })

  it('hangs its panel full width under the bar, at the height of the open content', async () => {
    await mount()
    expect($('mega-menu-viewport').className.split(' ')).toEqual(expect.arrayContaining(['fui-mega-menu-viewport', 'absolute', 'inset-x-0', 'top-full', 'transition-all']))
    expect(readRegistryRecipes(join(import.meta.dirname, '../..')).trees['mega-menu-viewport']!.base).toMatchObject({ height: 'viewport' })
  })

  it('slides its panels in from the side of the trigger moved to, reading direction included', async () => {
    await mount()
    expect($('mega-menu-content').className.split(' ')).toEqual(
      expect.arrayContaining([
        'data-motion-from-end:slide-in-from-end-8',
        'data-motion-from-start:slide-in-from-start-8',
        'data-motion-to-end:slide-out-to-end-8',
        'data-motion-to-start:slide-out-to-start-8',
      ]),
    )
  })
})

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../../ui/navigation-menu'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('a navigation menu link', () => {
  it('takes the trigger size in the bar and the panel size in a panel', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () =>
        h(NavigationMenu, { modelValue: 'shop' }, () =>
          h(NavigationMenuList, null, () => [
            h(NavigationMenuItem, { value: 'shop' }, () => [
              h(NavigationMenuTrigger, null, () => 'Shop'),
              h(NavigationMenuContent, null, () => h(NavigationMenuLink, { href: '#', id: 'in-panel' }, () => 'Jackets')),
            ]),
            h(NavigationMenuItem, null, () => h(NavigationMenuLink, { href: '#', id: 'in-bar' }, () => 'Journal')),
          ]),
        ),
    })
    app.mount('#app')
    await settle()
    expect(document.getElementById('in-bar')!.className).toContain('fui-navigation-menu-link-bar')
    expect(document.getElementById('in-panel')!.className).toContain('fui-navigation-menu-link-panel')
  })
})

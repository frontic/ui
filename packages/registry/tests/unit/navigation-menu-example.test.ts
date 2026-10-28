// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import NavigationMenuDemo from '../../ui/navigation-menu/navigation-menu.example.vue'

const example = readFileSync(join(import.meta.dirname, '../../ui/navigation-menu/navigation-menu.example.vue'), 'utf8')

// Browsers tag computed styles, so Vue leaves them unwrapped; happy-dom's would be proxied and break reka's Presence.
Object.defineProperty(window.CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: 'CSSStyleDeclaration', configurable: true })

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('the navigation menu example', () => {
  it('stacks its two-column panel into one narrow column on a phone, so the panel stays on screen', () => {
    const panel = example.match(/<ul class="(grid [^"]*)">/)![1].split(' ')
    expect(panel).not.toContain('w-md')
    expect(panel).not.toContain('grid-cols-2')
    expect(panel).toEqual(expect.arrayContaining(['@lg:w-md', '@lg:grid-cols-2']))
  })

  it('opens on its Shop panel, so the space it keeps for a panel shows one', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(NavigationMenuDemo) })
    app.mount('#app')
    await nextTick()
    await nextTick()
    expect(document.body.textContent).toContain('Shells and insulated layers for the trail.')
  })

  it('points an arrow from the open item at its panel', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(NavigationMenuDemo) })
    app.mount('#app')
    for (let i = 0; i < 3; i++) await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const indicator = document.querySelector('[data-slot="navigation-menu-indicator"]')
    expect(indicator?.getAttribute('data-state')).toBe('visible')
    expect(indicator!.closest('[data-slot="navigation-menu"]')).not.toBeNull()
    expect(indicator!.querySelector('.fui-navigation-menu-indicator-arrow')).not.toBeNull()
  })

  it('places the arrow under the open trigger: it takes the size and offset reka measures from it', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(NavigationMenuDemo) })
    app.mount('#app')
    for (let i = 0; i < 3; i++) await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const indicator = document.querySelector('[data-slot="navigation-menu-indicator"]')!
    expect([...indicator.classList]).toEqual(expect.arrayContaining(['absolute', 'left-0', 'translate-x-(--reka-navigation-menu-indicator-position)']))
    expect((indicator as HTMLElement).style.width).toBe('var(--reka-navigation-menu-indicator-size)')
    // reka measures the trigger's offsetLeft, which a positioned item would reset to 0.
    const items = [...document.querySelectorAll('[data-slot="navigation-menu-item"]')]
    expect(items.filter((item) => item.classList.contains('relative'))).toEqual([])
  })

  it('keeps each item positioned without a viewport, where a panel opens under its own trigger', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(NavigationMenuDemo, { viewport: false }) })
    app.mount('#app')
    await nextTick()
    const items = [...document.querySelectorAll('[data-slot="navigation-menu-item"]')]
    expect(items.length).toBe(3)
    expect(items.every((item) => item.classList.contains('relative'))).toBe(true)
  })
})

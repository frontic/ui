// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import HeaderCentered from '../../templates/header-centered/HeaderCentered.vue'
import HeaderShop from '../../templates/header-shop/HeaderShop.vue'

describe('header navigation slot', () => {
  it('header-shop grows the navigation in a flex-1 wrapper', async () => {
    const html = (await renderToString(h(HeaderShop, null, { navigation: () => h('nav', 'N') }))).replace(/<!--.*?-->/g, '')
    expect(html).toContain('<div class="flex-1"><nav>N</nav></div>')
  })

  it('header-centered centres the navigation in a flex justify-center wrapper', async () => {
    const html = (await renderToString(h(HeaderCentered, null, { navigation: () => h('nav', 'N') }))).replace(/<!--.*?-->/g, '')
    expect(html).toContain('<div class="flex justify-center"><nav>N</nav></div>')
  })
})

// Button joins a passed class after its own inline-flex; a bare `hidden` loses to it, so a wrapper hides the button.
describe('header account button', () => {
  it.each([
    ['header-shop', HeaderShop],
    ['header-centered', HeaderCentered],
  ])('%s hides it below @2xl on a wrapper, not on Button', async (_, Item) => {
    const html = (await renderToString(h(Item))).replace(/<!--.*?-->/g, '')
    expect(html).toMatch(/<div class="hidden @2xl:flex"><button [^>]*aria-label="Account"/)
    expect(html).not.toMatch(/<button [^>]*data-slot="button"[^>]*class="[^"]*\shidden(?:\s|")/)
  })
})

describe('header-centered below @5xl', () => {
  it('puts its own menu button beside search and hides the navigation row, both swapped at @5xl', async () => {
    const html = (await renderToString(h(HeaderCentered))).replace(/<!--.*?-->/g, '')
    const menu = html.indexOf('<div class="flex @5xl:hidden"><button')
    expect(menu).toBeGreaterThan(-1)
    expect(html.indexOf('aria-label="Open menu"', menu)).toBeLessThan(html.indexOf('aria-label="Search"'))
    expect(html).toMatch(/<div class="hidden @5xl:block"><div data-slot="header-centered-nav"/)
  })

  it('keeps a passed navigation on every width, with no menu button of its own', async () => {
    const html = (await renderToString(h(HeaderCentered, null, { navigation: () => h('nav', 'N') }))).replace(/<!--.*?-->/g, '')
    expect(html).not.toContain('@5xl:hidden')
    expect(html).not.toContain('hidden @5xl:block')
  })

  it('opens the navigation sheet from that button', async () => {
    const opened: boolean[] = []
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp({ render: () => h(HeaderCentered, { 'onUpdate:menuOpen': (v: boolean) => opened.push(v) }) })
    app.mount('#app')
    document.querySelector<HTMLButtonElement>('div.\\@5xl\\:hidden > button')!.click()
    await nextTick()
    expect(opened).toEqual([true])
    app.unmount()
  })
})

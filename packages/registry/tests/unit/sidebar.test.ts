// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarRail, SidebarSeparator } from '../../ui/sidebar'
import { physicalSide } from '../../ui/sidebar/utils'
import SidebarDemo from '../../ui/sidebar/sidebar.example.vue'

const sidebar = (props: Record<string, unknown>, name: string) =>
  h(Sidebar, props, () => [h(SidebarMenuButton, { 'data-test': `${name}-button` }, () => name), h(SidebarRail, { 'data-test': `${name}-rail` })])

const layout = (open: boolean, insetFirst = false) =>
  defineComponent({
    setup: () => () =>
      h(SidebarProvider, { open, variant: 'inset' }, () => [
        ...(insetFirst ? [h(SidebarInset, null, () => 'page')] : []),
        sidebar({ side: 'start', collapsible: 'icon' }, 'start'),
        ...(insetFirst ? [] : [h(SidebarInset, null, () => 'page')]),
        sidebar({ side: 'end', collapsible: 'none' }, 'end'),
      ]),
  })

const classOf = (selector: string) => document.querySelector(selector)?.className ?? ''

describe('two sidebars in one provider', () => {
  it('each styles its own buttons and rail; the inset stays raised beside the inset one', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(layout(false))
    app.mount('#app')
    await nextTick()
    expect(classOf('[data-test="start-button"]')).toContain('fui-sidebar-menu-button-collapsed')
    expect(classOf('[data-test="end-button"]')).toContain('fui-sidebar-menu-button-expanded')
    expect(classOf('[data-test="start-rail"]').split(' ')).toEqual(expect.arrayContaining(['cursor-e-resize', 'rtl:cursor-w-resize']))
    expect(classOf('[data-slot="sidebar-inset"]')).toContain('fui-sidebar-inset-raised')
    app.unmount()
  })
})

describe('a server-rendered inset layout', () => {
  it.each([false, true])('paints the wrapper, raises the inset and insets the sidebar from the provider prop (inset first: %s)', async (insetFirst) => {
    const html = await renderToString(createSSRApp(layout(true, insetFirst)))
    const page = new DOMParser().parseFromString(html, 'text/html')
    expect(page.querySelector('[data-slot="sidebar-wrapper"]')!.className.split(' ')).toContain('fui-sidebar-wrapper-inset')
    expect(page.querySelector('[data-slot="sidebar-inset"]')!.className).toContain('fui-sidebar-inset-raised')
    expect(page.querySelector('[data-slot="sidebar"][data-side="start"]')!.getAttribute('data-variant')).toBe('inset')
  })
})

describe('an inset sidebar under a default provider', () => {
  afterEach(() => vi.restoreAllMocks())
  it('warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(SidebarProvider, null, () => h(Sidebar, { variant: 'inset' })) }))
    app.mount('#app')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SidebarProvider variant="inset"'))
    app.unmount()
  })
})

describe('the sidebar width', () => {
  it('the gap, the container and a none sidebar wear sidebar-size’s width; offcanvas slides the container by its own width', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(
      defineComponent({ setup: () => () => h(SidebarProvider, { open: false }, () => [h(Sidebar, { collapsible: 'offcanvas' }), h(Sidebar, { side: 'end' }), h(Sidebar, { collapsible: 'none' })]) }),
    )
    app.mount('#app')
    await nextTick()
    for (const gap of document.querySelectorAll('[data-slot="sidebar-gap"]')) expect(gap.className.split(' ')).toContain('fui-sidebar-size')
    expect(document.querySelector('div[data-slot="sidebar"]:not([data-side])')!.className.split(' ')).toContain('fui-sidebar-size')
    const containers = [...document.querySelectorAll('[data-slot="sidebar-container"]')].map((e) => e.className.split(' '))
    for (const container of containers) expect(container).toEqual(expect.arrayContaining(['fui-sidebar-size']))
    for (const container of containers) expect(container.filter((c) => c.startsWith('fui-sidebar-gap'))).toEqual([])
    expect(containers[0]).toEqual(expect.arrayContaining(['inset-s-0', '-translate-x-full', 'rtl:translate-x-full', 'fui-sidebar-container-start']))
    expect(containers[1]).toEqual(expect.arrayContaining(['inset-e-0', 'translate-x-full', 'rtl:-translate-x-full', 'fui-sidebar-container-end']))
    expect(containers.flat().filter((c) => /^-?(?:left|right)-/.test(c))).toEqual([])
    app.unmount()
  })
})

describe('a start or end sidebar', () => {
  it('lands start on the left in a left-to-right direction and on the right in a right-to-left one, for the mobile sheet and the collapsed tooltip', () => {
    expect([physicalSide('start', 'ltr'), physicalSide('end', 'ltr')]).toEqual(['left', 'right'])
    expect([physicalSide('start', 'rtl'), physicalSide('end', 'rtl')]).toEqual(['right', 'left'])
  })
})

describe('the sidebar spacing', () => {
  it('pads the header, footer and groups, spaces the menu and insets the separator from recipes', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(
      defineComponent({
        setup: () => () =>
          h(SidebarProvider, null, () => h(Sidebar, { collapsible: 'none' }, () => [h(SidebarHeader), h(SidebarGroup, null, () => h(SidebarMenu)), h(SidebarSeparator), h(SidebarFooter)])),
      }),
    )
    app.mount('#app')
    await nextTick()
    const classes = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!.className.split(' ')
    for (const slot of ['sidebar-header', 'sidebar-footer', 'sidebar-group', 'sidebar-menu', 'sidebar-separator']) {
      expect(classes(slot)).toContain(`fui-${slot}`)
      expect(classes(slot).filter((c) => /^(?:p|gap|mx)-/.test(c))).toEqual([])
    }
    app.unmount()
  })
})

describe('the sidebar demo', () => {
  it("filters the men's jackets, chips each active filter and clears them all", async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(SidebarDemo)
    app.mount('#app')
    await nextTick()
    const badge = () => document.querySelector('[data-slot="sidebar-inset"] header')!.textContent!.match(/(\d+) products/)![1]
    const chips = () => [...document.querySelectorAll('[data-slot="sidebar-header"] [role="row"]')].map((e) => e.textContent!.trim())
    expect(document.querySelector('[data-slot="sidebar-menu-button"][data-active]')!.textContent).toContain('Jackets')
    expect(badge()).toBe('19')
    expect(chips()).toEqual([])
    ;(document.querySelector('[role="switch"]') as HTMLElement).click()
    await nextTick()
    expect(badge()).toBe('15')
    expect(chips()).toEqual(['In stock'])
    const clear = [...document.querySelectorAll('[data-slot="sidebar-footer"] button')].find((b) => b.textContent!.includes('Clear all')) as HTMLButtonElement
    clear.click()
    await nextTick()
    expect([badge(), chips()]).toEqual(['19', []])
    app.unmount()
  })

  it('loads the brands only once the sidebar first opens, so a phone-width viewer still sees the skeleton rows', async () => {
    const happyDOM = (window as unknown as { happyDOM: { setViewport: (v: { width: number }) => void } }).happyDOM
    const width = window.innerWidth
    happyDOM.setViewport({ width: 500 })
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(SidebarDemo)
    try {
      app.mount('#app')
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 700))
      document.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!.click()
      await nextTick()
      await nextTick()
      const skeletons = () => document.querySelectorAll('[data-mobile="true"] [data-slot="sidebar-menu-skeleton"]')
      expect(document.querySelector('[data-mobile="true"] [data-slot="sidebar-input"]')).not.toBeNull()
      expect(skeletons()).toHaveLength(4)
      await new Promise((resolve) => setTimeout(resolve, 700))
      expect(skeletons()).toHaveLength(0)
    } finally {
      app.unmount()
      happyDOM.setViewport({ width })
    }
  })

  it('loads the brands behind skeleton rows, searches and filters by them, and folds each category with its chevron', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(SidebarDemo)
    app.mount('#app')
    await nextTick()
    const brandGroup = () => [...document.querySelectorAll('[data-slot="sidebar-group"]')].find((g) => g.textContent!.includes('Brand'))!
    expect(brandGroup().querySelectorAll('[data-slot="sidebar-menu-skeleton"]')).toHaveLength(4)
    await new Promise((resolve) => setTimeout(resolve, 700))
    const brands = () => [...brandGroup().querySelectorAll('[data-slot="sidebar-menu-item"]')].map((e) => e.textContent!.replace(/\s+/g, ' ').trim())
    expect(brandGroup().querySelector('[data-slot="sidebar-menu-skeleton"]')).toBeNull()
    expect(brands()).toEqual(['Highmoor4', 'Northridge5', 'Ridgeline5', 'Tarnfell5'])
    const search = brandGroup().querySelector<HTMLInputElement>('[data-slot="sidebar-input"]')!
    search.value = 'ridge'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    expect(brands()).toEqual(['Northridge5', 'Ridgeline5'])
    brandGroup().querySelector<HTMLElement>('[data-slot="sidebar-menu-button"]')!.click()
    await nextTick()
    expect(document.querySelector('[data-slot="sidebar-inset"] header')!.textContent).toContain('5 products')
    expect([...document.querySelectorAll('[data-slot="sidebar-header"] [role="row"]')].map((e) => e.textContent!.trim())).toEqual(['Northridge'])
    const actions = [...document.querySelectorAll<HTMLElement>('[data-slot="sidebar-menu-action"]')]
    expect(actions.map((a) => a.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'false'])
    actions[1]!.click()
    await nextTick()
    expect(actions[1]!.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelectorAll('[data-slot="sidebar-menu-sub"]')).toHaveLength(2)
    app.unmount()
  })
})

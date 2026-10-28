import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import NavigationShop from '../../sections/navigation-shop/NavigationShop.vue'

const slot = 'navigation-shop'

describe.each(['beside', 'above', 'captioned'])('the %s layout', (layout) => {
  const Navigation = (props: Record<string, unknown>) => h(NavigationShop, { layout, ...props })

  it('renders a category without href or menu as an inert span, never an anchor', async () => {
    const html = await renderToString(Navigation({ categories: [{ name: 'Sale' }] }))
    expect(html).toMatch(new RegExp(`<span data-slot="${slot}-page" class="[^"]*\\bpointer-events-none\\b[^"]*">Sale</span>`))
    expect(html).not.toContain('<a')
  })

  it('renders a category with href as the page link', async () => {
    const html = await renderToString(Navigation({ categories: [{ name: 'Sale', href: '/sale' }] }))
    const anchor = new RegExp(`<a [^>]*data-slot="${slot}-page"[^>]*>`).exec(html)?.[0]
    expect(anchor).toContain('href="/sale"')
    expect(anchor).not.toContain('pointer-events-none')
  })
})

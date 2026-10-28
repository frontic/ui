// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { HeaderCentered } from '../../templates/header-centered'
import { HeaderShop } from '../../templates/header-shop'

const render = async (header: typeof HeaderShop | typeof HeaderCentered, search?: (props: { presentation: string }) => unknown) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(header, { logoText: 'Basecamp' }, search ? { search } : {}))
  return host
}

describe.each([
  ['HeaderShop', HeaderShop],
  ['HeaderCentered', HeaderCentered],
] as const)('%s', (_, header) => {
  it('renders its search slot inline from @5xl and as the overlay button below, in place of its own button', async () => {
    const host = await render(header, ({ presentation }) => h('span', { 'data-search': presentation }))
    expect(host.querySelector('[data-search="inline"]')!.parentElement!.className.split(' ')).toEqual(expect.arrayContaining(['hidden', '@5xl:block']))
    expect(host.querySelector('[data-search="overlay"]')!.parentElement!.className.split(' ')).toEqual(expect.arrayContaining(['flex', '@5xl:hidden']))
    expect(host.querySelector('button[aria-label="Search"]')).toBeNull()
  })

  it('keeps its search button without a slot', async () => {
    const host = await render(header)
    expect(host.querySelector('button[aria-label="Search"]')).not.toBeNull()
    expect(host.querySelector('[data-search]')).toBeNull()
  })
})

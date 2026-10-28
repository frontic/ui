// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Search, SearchGroup, SearchHighlight, SearchInput, SearchItem, SearchOverlay, SearchQuery, SearchResults, SearchTag } from '../../ui/search'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await settle()
}
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
}
afterEach(() => app?.unmount())

const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const marks = () => [...document.querySelectorAll('mark')].map((mark) => mark.textContent)

const search = (query: ReturnType<typeof ref<string>>, events: Record<string, unknown> = {}) =>
  h(Search, { query: query.value, 'onUpdate:query': (next: string) => (query.value = next), open: true, ...events }, () => [
    h(SearchInput),
    h(SearchResults, { position: 'inline' }, () => [
      h(SearchQuery),
      h(SearchGroup, { heading: 'Products' }, () => [h(SearchItem, { value: 'frost-escape-parka', href: '#parka' }, () => h(SearchHighlight, { text: 'Frost Escape Parka' }))]),
      h(SearchTag, { query: 'ski goggles' }),
    ]),
  ])

describe('SearchHighlight', () => {
  const marked = async (text: string, terms?: string | string[]) => {
    await mount(() => h(SearchHighlight, { text, terms }))
    return marks()
  }

  it('marks every match, ignoring case', async () => {
    expect(await marked('Parka and parka', 'PARKA')).toEqual(['Parka', 'parka'])
  })

  it('prefers the longest term where two overlap', async () => {
    expect(await marked('Snowflake Ski Goggles', ['gog', 'goggles'])).toEqual(['Goggles'])
  })

  it('takes terms with regex characters literally', async () => {
    expect(await marked('TrailMaster 22 (20L)', '(20L)')).toEqual(['(20L)'])
  })
})

describe('a Search', () => {
  it('opens a result without selecting it or writing it into the field', async () => {
    const query = ref('parka')
    const onSelect = vi.fn()
    await mount(() => search(query, { onSelect }))
    const item = $('[data-slot="search-item"]')
    item.click()
    await settle()
    expect(onSelect).toHaveBeenCalledWith('frost-escape-parka')
    expect(item.getAttribute('aria-selected')).toBe('false')
    expect(query.value).toBe('parka')
    expect(($('input') as HTMLInputElement).value).toBe('parka')
  })

  it('marks the result for the current query, not the one it first rendered for', async () => {
    const query = ref('par')
    await mount(() => search(query))
    expect(marks()).toEqual(['Par'])
    query.value = 'escape'
    await settle()
    expect(marks()).toEqual(['Escape'])
  })

  it('runs a tag as the query and highlights its "Search for" row, so Enter submits it', async () => {
    const query = ref('')
    const onSubmit = vi.fn()
    await mount(() => search(query, { onSubmit }))
    $('[data-slot="search-tag"]').click()
    await settle()
    expect(query.value).toBe('ski goggles')
    expect($('[data-slot="search-query"]').hasAttribute('data-highlighted')).toBe(true)
    $('[data-slot="search-query"]').click()
    await settle()
    expect(onSubmit).toHaveBeenCalledWith('ski goggles')
  })
})

describe('a SearchTag that links to the results page', () => {
  it('leaves the navigation to its link: it closes the panel and emits nothing a handler would navigate on again', async () => {
    const query = ref('')
    const open = ref(true)
    const onSubmit = vi.fn()
    const onSelect = vi.fn()
    await mount(() =>
      h(Search, { query: query.value, open: open.value, 'onUpdate:open': (next: boolean) => (open.value = next), onSubmit, onSelect }, () =>
        h(SearchResults, { position: 'inline' }, () => h(SearchTag, { query: 'parka', href: '/search?q=parka' })),
      ),
    )
    const tag = $('[data-slot="search-tag"]')
    expect(tag.getAttribute('href')).toBe('/search?q=parka')
    tag.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await settle()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
    expect(open.value).toBe(false)
  })
})

describe('a SearchOverlay', () => {
  const overlay = async () => {
    const open = ref(true)
    const query = ref('parka')
    await mount(() => h(SearchOverlay, { open: open.value, 'onUpdate:open': (next: boolean) => (open.value = next) }, () => search(query)))
    return open
  }

  it('closes on the first Esc, not after the panel inside it closes', async () => {
    const open = await overlay()
    $('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(open.value).toBe(false)
  })

  it('leaves nothing on the page while closed, and its panel goes once it closes', async () => {
    const open = await overlay()
    expect($('[data-slot="search-overlay"]')).not.toBeNull()
    open.value = false
    await settle()
    expect(document.body.querySelector('.fixed')).toBeNull()
    await mount(() => h(SearchOverlay, { open: false }, () => search(ref('parka'))))
    expect(document.body.querySelector('.fixed')).toBeNull()
  })

  it('closes when the shopper opens a result', async () => {
    const open = await overlay()
    $('[data-slot="search-item"]').click()
    await settle()
    expect(open.value).toBe(false)
  })
})

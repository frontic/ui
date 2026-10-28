// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { SearchSuggestions, type SearchResult } from '../../sections/search-suggestions'

let app: ReturnType<typeof createApp> | undefined
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
}
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div><input id="elsewhere">'
  app = createApp({ render: () => h(SearchSuggestions, props) })
  app.mount('#app')
  await settle()
}
afterEach(() => app?.unmount())
beforeAll(() => Object.defineProperty(HTMLElement.prototype, 'offsetParent', { get: () => document.body, configurable: true }))

const parka = (amount: number) => ({ name: 'Frost Escape Parka', href: '#/p/frost-escape-parka', price: { amount, currency: 'EUR' } })
const results = (query: string, total?: number): SearchResult => ({ query, products: [parka(14900)], categories: [], brands: [], total })
const rows = () => [...document.querySelectorAll('[role="option"]')].map((row) => row.textContent?.trim())

describe('SearchSuggestions', () => {
  it('keeps results for an older query off the panel and shows the loading rows instead', async () => {
    await mount({ query: 'parkas', open: true, results: results('park') })
    expect(rows()).toEqual(['Search for "parkas"'])
    expect(document.querySelector('[data-slot="search-loading"]')).not.toBeNull()
  })

  it('shows results that answer the query, and tells screen readers how many', async () => {
    await mount({ query: 'parka', open: true, results: results('parka') })
    expect(rows()).toEqual(['Search for "parka"', 'Frost Escape Parka€149.00'])
    expect(document.querySelector('[role="status"]')?.textContent).toBe('1 result')
  })

  it('offers "See all" only when the shop found more than the panel lists', async () => {
    const searchHref = (q: string) => `/search?q=${q}`
    await mount({ query: 'parka', open: true, results: results('parka', 1), searchHref })
    expect(rows()).not.toContain('See all 1 results')
    app!.unmount()
    await mount({ query: 'parka', open: true, results: results('parka', 12), searchHref })
    expect(rows()).toContain('See all 12 results')
  })

  it('sends the href of the row the shopper opens, picks and "See all" included', async () => {
    const opened: string[] = []
    const props = { open: true, collections: [{ title: 'Staff picks', products: [parka(14900)] }], searchHref: (q: string) => `/search?q=${q}`, onSelect: (href: string) => opened.push(href) }
    await mount({ ...props, query: '' })
    document.querySelector<HTMLElement>('[data-slot="search-suggestions-pick"]')!.click()
    app!.unmount()
    await mount({ ...props, query: 'parka', results: results('parka', 12) })
    ;[...document.querySelectorAll<HTMLElement>('[role="option"]')].find((row) => row.textContent?.includes('See all'))!.click()
    await settle()
    expect(opened).toEqual(['#/p/frost-escape-parka', '/search?q=parka'])
  })

  it('gives a pick’s name two lines, breaking a long word, instead of cutting it after a few letters', async () => {
    await mount({ open: true, query: '', collections: [{ title: 'Staff picks', products: [parka(14900)] }] })
    const name = document.querySelector('[data-slot="search-suggestions-pick"] [data-slot="line-title"]')!
    expect([...name.classList]).toEqual(expect.arrayContaining(['line-clamp-2', 'wrap-break-word']))
    expect(name.classList).not.toContain('truncate')
  })

  describe('with the "/" shortcut', () => {
    const slash = (target: EventTarget) => target.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))

    it('focuses the field', async () => {
      await mount({ shortcut: true })
      slash(document.body)
      expect(document.activeElement).toBe(document.querySelector('[role="combobox"]'))
    })

    it('leaves a "/" typed into another field alone', async () => {
      await mount({ shortcut: true })
      const elsewhere = document.querySelector<HTMLInputElement>('#elsewhere')!
      elsewhere.focus()
      slash(elsewhere)
      expect(document.activeElement).toBe(elsewhere)
    })

    it('opens the overlay when the search sits behind a button', async () => {
      const open = ref(false)
      await mount({ shortcut: true, presentation: 'overlay', open: open.value, 'onUpdate:open': (next: boolean) => (open.value = next) })
      slash(document.body)
      expect(open.value).toBe(true)
    })

    it('gives focus back to its search button when the overlay closes, though a click never focused it, as in Safari', async () => {
      await mount({ presentation: 'overlay' })
      const button = document.querySelector<HTMLButtonElement>('[data-slot="search-overlay-trigger"]')!
      expect(button.getAttribute('aria-haspopup')).toBe('dialog')
      button.click()
      await settle()
      expect(button.getAttribute('aria-expanded')).toBe('true')
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await settle()
      expect(document.querySelector('[data-slot="search-overlay"]')).toBeNull()
      expect(document.activeElement).toBe(button)
    })
  })
})

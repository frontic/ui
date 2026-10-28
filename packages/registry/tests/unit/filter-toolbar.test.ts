// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterToolbar } from '../../templates/filter-toolbar'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('filter toolbar', () => {
  it('names its sort select for screen readers and keeps the current sort in the name', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(FilterToolbar, { products: [], totalResults: 0, activeSorting: 'relevance', sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
    app.mount('#app')
    await nextTick()
    const trigger = document.querySelector('[data-slot=select-trigger]')!
    const name = trigger
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((ref) => document.getElementById(ref)!.textContent!.trim())
      .join(' ')
    expect(name).toBe('Sort by Relevance')
  })

  it('reads just the label while no sort is chosen, not the placeholder after it', async () => {
    app?.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(FilterToolbar, { products: [], totalResults: 0, sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
    app.mount('#app')
    await nextTick()
    const refs = document.querySelector('[data-slot=select-trigger]')!.getAttribute('aria-labelledby')!.split(' ')
    expect(refs.map((ref) => document.getElementById(ref)!.textContent!.trim()).join(' ')).toBe('Sort by')
  })
})

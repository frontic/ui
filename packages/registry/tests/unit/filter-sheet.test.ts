// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterSheet } from '../../templates/filter-sheet'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('filter sheet', () => {
  it('offers sorting at every width, named for screen readers', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(FilterSheet, { products: [], totalResults: 0, activeSorting: 'relevance', sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
    app.mount('#app')
    await nextTick()
    const trigger = document.querySelector('[data-slot=select-trigger]')!
    const name = trigger
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((ref) => document.getElementById(ref)!.textContent!.trim())
      .join(' ')
    expect(name).toBe('Sort by Relevance')
    for (let el: Element | null = trigger; el; el = el.parentElement) expect(el.classList.contains('hidden'), el.className).toBe(false)
  })

  it('reads just the label while no sort is chosen, not the placeholder after it', async () => {
    app?.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(FilterSheet, { products: [], totalResults: 0, sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
    app.mount('#app')
    await nextTick()
    const refs = document.querySelector('[data-slot=select-trigger]')!.getAttribute('aria-labelledby')!.split(' ')
    expect(refs.map((ref) => document.getElementById(ref)!.textContent!.trim()).join(' ')).toBe('Sort by')
  })
})

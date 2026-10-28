// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterSidebar } from '../../templates/filter-sidebar'

let app: ReturnType<typeof createApp> | undefined
const mount = async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(FilterSidebar, { products: [], totalResults: 0, activeSorting: 'relevance', sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())
const toggle = () => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => /hide filters|show filters/i.test(b.textContent!))!
const aside = () => document.querySelector('aside')!

describe('filter sidebar', () => {
  it('names its sort select for screen readers and keeps the current sort in the name', async () => {
    await mount()
    const trigger = document.querySelector('[data-slot=select-trigger]')!
    const name = trigger
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((ref) => document.getElementById(ref)!.textContent!.trim())
      .join(' ')
    expect(name).toBe('Sort by Relevance')
  })

  it('says whether the filter panel is open and which panel its toggle controls', async () => {
    await mount()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    expect(toggle().getAttribute('aria-controls')).toBe(aside().id)
    toggle().click()
    await nextTick()
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps the closed panel’s fields out of the tab order', async () => {
    await mount()
    expect(aside().hasAttribute('inert')).toBe(false)
    toggle().click()
    await nextTick()
    expect(aside().hasAttribute('inert')).toBe(true)
  })

  it('reads just the label while no sort is chosen, not the placeholder after it', async () => {
    app?.unmount()
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(FilterSidebar, { products: [], totalResults: 0, sortOptions: [{ key: 'relevance', value: 'relevance', label: 'Relevance' }] }) })
    app.mount('#app')
    await nextTick()
    const refs = document.querySelector('[data-slot=select-trigger]')!.getAttribute('aria-labelledby')!.split(' ')
    expect(refs.map((ref) => document.getElementById(ref)!.textContent!.trim()).join(' ')).toBe('Sort by')
  })
})

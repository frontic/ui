// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterList } from '../../ui/filter'

let app: ReturnType<typeof createApp> | undefined
// The list is virtualized: it renders the rows that fit the height it measures.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 400, top: 0, left: 0, right: 300, bottom: 400, x: 0, y: 0, toJSON: () => ({}) })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
})
afterEach(() => {
  app?.unmount()
  vi.restoreAllMocks()
})

const options = ['Résumé paper', 'Linen', 'Crêpe'].map((option) => ({ option, value: option.toLowerCase(), count: 1 }))
const search = async (term: string) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(FilterList, { options, searchable: true }) })
  app.mount('#app')
  const input = document.querySelector('input')!
  input.value = term
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  return options.map((o) => o.option).filter((label) => document.body.textContent!.includes(label))
}

describe('a searchable filter list', () => {
  it('finds "Résumé" when the shopper types "resume"', async () => {
    expect(await search('resume')).toEqual(['Résumé paper'])
  })

  it('matches without regard to case or accents, and keeps everything for an empty search', async () => {
    expect(await search('CREPE')).toEqual(['Crêpe'])
    expect(await search('')).toEqual(['Résumé paper', 'Linen', 'Crêpe'])
  })
})

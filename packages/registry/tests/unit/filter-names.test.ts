// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FilterGroup, FilterList, FilterSwatch } from '../../ui/filter'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const name = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!.getAttribute('aria-label')

const colours = [{ value: 'charcoal', hex: '#4b4b48', label: 'Charcoal', count: 2 }]
const sizes = [{ value: 'm', option: 'M', count: 3 }]

describe('the option lists of a filter', () => {
  it('take the name of the FilterGroup around them, so a screen reader hears what the colours and sizes are for', async () => {
    await mount(() => [
      h(FilterGroup, { label: 'Colour', type: 'collapsible', defaultOpen: true }, () => h(FilterSwatch, { options: colours })),
      h(FilterGroup, { label: 'Size', type: 'collapsible', defaultOpen: true }, () => h(FilterList, { options: sizes })),
    ])
    expect([name('filter-swatch'), name('filter-list-content')]).toEqual(['Colour', 'Size'])
  })

  it('take a name of their own when the title sits elsewhere, e.g. on a popover button', async () => {
    await mount(() => [h(FilterSwatch, { options: colours, ariaLabel: 'Colour' }), h(FilterList, { options: sizes, ariaLabel: 'Size' })])
    expect([name('filter-swatch'), name('filter-list-content')]).toEqual(['Colour', 'Size'])
  })
})

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { FilterGroup, FilterPrice, FilterSlider } from '../../ui/filter'

describe('FilterPrice', () => {
  it('is the filter slider with its readout in the currency', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(FilterPrice, { label: 'Price', min: 5000, max: 15000, value: { from: 7000, to: 15000 }, locale: 'en-IE' }))
    expect(host.querySelector('[data-slot="filter-price"]')).toBeNull()
    expect(host.querySelector('[data-slot="filter-slider"] [data-slot="filter-slider-value"]')?.textContent?.trim()).toBe('€70.00 – €150.00')
  })
})

describe('the thumbs of a filter slider', () => {
  let app: ReturnType<typeof createApp> | undefined
  afterEach(() => app?.unmount())
  const mount = async (render: () => unknown) => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render })
    app.mount('#app')
    await nextTick()
    await nextTick()
  }
  // The accessible name: aria-labelledby's elements in order, each by its aria-label or its text.
  const names = () =>
    [...document.querySelectorAll<HTMLElement>('[role="slider"]')].map(
      (thumb) =>
        (thumb.getAttribute('aria-labelledby') ?? '')
          .split(' ')
          .filter(Boolean)
          .map((id) => {
            const ref = document.getElementById(id)!
            return ref.getAttribute('aria-label') ?? ref.textContent!.trim()
          })
          .join(' ') || thumb.getAttribute('aria-label'),
    )
  const values = () => [...document.querySelectorAll('[role="slider"]')].map((thumb) => thumb.getAttribute('aria-valuetext'))

  it('take their name from the filter title and read their price in the currency', async () => {
    await mount(() => h(FilterPrice, { label: 'Price', min: 5000, max: 15000, value: { from: 6000, to: 12000 }, locale: 'en-IE' }))
    expect(names()).toEqual(['Price Minimum', 'Price Maximum'])
    expect(values()).toEqual(['€60.00', '€120.00'])
  })

  it('take the group’s name when the slider has no title of its own', async () => {
    await mount(() => h(FilterGroup, { label: 'Price', type: 'collapsible', defaultOpen: true }, () => h(FilterPrice, { min: 5000, max: 15000, value: { from: 6000, to: 12000 } })))
    expect(names()).toEqual(['Price Minimum', 'Price Maximum'])
  })

  it('take a name given for a title that sits outside, e.g. on an accordion trigger, before the group’s', async () => {
    await mount(() => h(FilterGroup, { label: 'Filters', type: 'collapsible', defaultOpen: true }, () => h(FilterPrice, { ariaLabel: 'Price', min: 5000, max: 15000, value: { to: 12000 } })))
    expect(names()).toEqual(['Price'])
  })

  it('read the plain number when the filter does not format its values', async () => {
    await mount(() => h(FilterSlider, { label: 'Weight', min: 0, max: 10, value: { from: 2, to: 8 } }))
    expect(names()).toEqual(['Weight Minimum', 'Weight Maximum'])
    expect(values()).toEqual([null, null])
  })
})

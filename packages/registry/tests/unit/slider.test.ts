// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Slider } from '../../ui/slider'
import SliderDemo from '../../ui/slider/slider.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
const thumbs = () => [...document.querySelectorAll<HTMLElement>('[role="slider"]')]
// The accessible name: aria-labelledby's elements in order, each by its aria-label or its text.
const nameOf = (el: HTMLElement) =>
  (el.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => {
      const ref = document.getElementById(id)!
      return ref.getAttribute('aria-label') ?? ref.textContent!.trim()
    })
    .join(' ') ||
  (el.getAttribute('aria-label') ?? '')
afterEach(() => app?.unmount())

describe('a range slider', () => {
  it('names each thumb after the label and then its own name, Reka’s Minimum and Maximum by default', async () => {
    await mount(() => h(Slider, { defaultValue: [60, 120], label: 'Price' }))
    expect(thumbs().map(nameOf)).toEqual(['Price Minimum', 'Price Maximum'])
  })

  it('takes its own thumb names, so a German shop says Mindestpreis', async () => {
    await mount(() => h(Slider, { defaultValue: [60, 120], label: 'Preis', thumbLabels: ['Mindestpreis', 'Höchstpreis'] }))
    expect(thumbs().map(nameOf)).toEqual(['Preis Mindestpreis', 'Preis Höchstpreis'])
  })

  it('leaves a single thumb named by the label alone', async () => {
    await mount(() => h(Slider, { defaultValue: [40], label: 'Price' }))
    expect(thumbs().map(nameOf)).toEqual(['Price'])
  })
})

describe('a slider without a label', () => {
  it('names its thumbs from aria-label, after it a range thumb’s own name, and never points at a missing label', async () => {
    await mount(() => [h(Slider, { defaultValue: [40], ariaLabel: 'Price' }), h(Slider, { defaultValue: [60, 120], ariaLabel: 'Price' }), h(Slider, { defaultValue: [60, 120] })])
    expect(thumbs().map(nameOf)).toEqual(['Price', 'Price Minimum', 'Price Maximum', 'Minimum', 'Maximum'])
    expect(thumbs().filter((t) => t.getAttribute('aria-labelledby')?.includes('undefined'))).toEqual([])
  })

  it('names its thumbs by an outside title through aria-labelledby', async () => {
    await mount(() => [h('span', { id: 'price-title' }, 'Price'), h(Slider, { defaultValue: [60, 120], ariaLabelledby: 'price-title' })])
    expect(thumbs().map(nameOf)).toEqual(['Price Minimum', 'Price Maximum'])
  })
})

describe('a formatted slider', () => {
  it('shows the legend and reads each thumb with the format options', async () => {
    await mount(() => h(Slider, { defaultValue: [60, 120], min: 50, max: 150, showLegend: true, formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }, locale: 'en-IE' }))
    expect(document.querySelector('[data-slot="slider-legend"]')!.textContent!.replace(/\s+/g, '')).toBe('€50€150')
    expect(thumbs().map((t) => t.getAttribute('aria-valuetext'))).toEqual(['€60', '€120'])
  })

  it('shows plain numbers and leaves the thumb’s exact value to aria-valuenow when no format is given', async () => {
    await mount(() => h(Slider, { defaultValue: [0.0005], min: 0, max: 1000, step: 0.0005, showLegend: true }))
    expect(document.querySelector('[data-slot="slider-legend"]')!.textContent!.replace(/\s+/g, '')).toBe('01000')
    expect(thumbs()[0]!.hasAttribute('aria-valuetext')).toBe(false)
  })

  it('formats with its own function before the format options, e.g. a price kept in cents', async () => {
    const cents = (value: number) => `€${(value / 100).toFixed(2)}`
    await mount(() => h(Slider, { defaultValue: [6000], min: 5000, max: 15000, showLegend: true, format: cents, formatOptions: { style: 'currency', currency: 'EUR' } }))
    expect(document.querySelector('[data-slot="slider-legend"]')!.textContent!.replace(/\s+/g, '')).toBe('€50.00€150.00')
    expect(thumbs()[0]!.getAttribute('aria-valuetext')).toBe('€60.00')
  })
})

describe('the slider thumb', () => {
  it('stays a 12px square but grabs on a 24px hit area', async () => {
    await mount(() => h(Slider, { defaultValue: [40] }))
    expect(thumbs()[0]!.className.split(' ')).toEqual(expect.arrayContaining(['fui-slider-thumb', 'relative', 'after:absolute', 'after:-inset-1.5']))
  })
})

describe('a slider with formatOptions', () => {
  it('formats its values in its locale', async () => {
    await mount(() => h(Slider, { defaultValue: [60], max: 200, locale: 'de-DE', formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } }))
    expect(thumbs().map((t) => t.getAttribute('aria-valuetext'))).toEqual(['60\u00a0€'])
  })
})

describe('the slider demo', () => {
  it('is a price range across the men’s jackets, in euros', async () => {
    await mount(() => h(SliderDemo))
    expect(thumbs().map((t) => t.getAttribute('aria-valuetext'))).toEqual(['€60', '€120'])
  })
})

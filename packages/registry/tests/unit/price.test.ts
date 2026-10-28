// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Price, PriceAmount, PriceRef } from '../../ui/price'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const reduced = { amount: 9000, currency: 'EUR', ref: 11100 }
const plain = { amount: 9000, currency: 'EUR' }
const $ = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
const order = () => [...document.querySelectorAll('[data-slot]')].map((el) => el.getAttribute('data-slot')).filter((slot) => slot !== 'badge')

describe('a reduced Price', () => {
  it('puts the saving above, then the original price before the current one', async () => {
    await mount(() => h(Price, { price: reduced, locale: 'en-US' }))
    expect(order()).toEqual(['price', 'price-discount', 'price-discount-amount', 'price-row', 'price-ref', 'price-amount'])
    expect($('price-discount')!.textContent).toBe('-19%')
  })

  it('tells a screen reader which price was and which one is', async () => {
    await mount(() => h(Price, { price: reduced, locale: 'en-US' }))
    expect($('price-row')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('Was €111.00 Now €90.00')
    expect([...document.querySelectorAll('.sr-only')].map((el) => el.textContent!.trim())).toEqual(['Was', 'Now'])
  })

  it('takes its own words for them', async () => {
    await mount(() => h(Price, { price: reduced, locale: 'de-DE', refLabel: 'Statt', amountLabel: 'Jetzt' }))
    expect([...document.querySelectorAll('.sr-only')].map((el) => el.textContent!.trim())).toEqual(['Statt', 'Jetzt'])
  })

  it('sets the original price one text step below the current one', async () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      await mount(() => h(Price, { price: reduced, size }))
      expect($('price-ref')!.classList.contains(`fui-price-strike-${size}`)).toBe(true)
      app!.unmount()
      app = undefined
    }
  })
})

describe('a Price at full price', () => {
  it('shows the amount alone, with no saving and no screen-reader label', async () => {
    await mount(() => h(Price, { price: plain, locale: 'en-US' }))
    expect(order()).toEqual(['price', 'price-row', 'price-amount'])
    expect($('price-amount')!.textContent!.trim()).toBe('€90.00')
  })

  it('shows no saving when the reference price is not higher', async () => {
    await mount(() => h(Price, { price: { amount: 9000, currency: 'EUR', ref: 9000 }, locale: 'en-US' }))
    expect(order()).toEqual(['price', 'price-row', 'price-amount'])
  })
})

describe('the hint', () => {
  it('sits below the price when the slot holds one, and goes with showHint false', async () => {
    await mount(() => h(Price, { price: plain, locale: 'en-US' }, { hint: () => 'Incl. VAT' }))
    expect(order().at(-1)).toBe('price-hint')
    expect($('price-hint')!.textContent).toBe('Incl. VAT')
    app!.unmount()
    await mount(() => h(Price, { price: plain, locale: 'en-US', showHint: false }, { hint: () => 'Incl. VAT' }))
    expect($('price-hint')).toBeNull()
  })

  it('renders nothing without slot content', async () => {
    await mount(() => h(Price, { price: plain }))
    expect($('price-hint')).toBeNull()
  })
})

describe('a composed Price', () => {
  it('lines up on the end when asked', async () => {
    await mount(() => h(Price, { price: plain, align: 'end' }))
    expect($('price')!.classList.contains('fui-price-end')).toBe(true)
    expect($('price')!.classList.contains('fui-price-start')).toBe(false)
    expect(readRegistryRecipes(join(import.meta.dirname, '../..')).trees.price!.variants!.align).toEqual({
      start: { textAlign: 'start', alignItems: 'start' },
      end: { textAlign: 'end', alignItems: 'end' },
    })
  })

  it('drops the original price by itself when nothing is reduced', async () => {
    await mount(() => h(Price, { price: plain, locale: 'en-US' }, () => [h(PriceAmount), h(PriceRef)]))
    expect($('price-ref')).toBeNull()
    expect($('price-amount')!.textContent!.trim()).toBe('€90.00')
  })
})

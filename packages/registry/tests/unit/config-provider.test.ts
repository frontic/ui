// @vitest-environment happy-dom
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { createApp, h, nextTick } from 'vue'
import { Price } from '../../ui/price'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs'
import { CartFull } from '../../templates/cart-full'

const root = join(import.meta.dirname, '../..')
const demos = import.meta.glob<{ default: Component }>('../../ui/*/*.example.vue', { eager: true })

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.config.warnHandler = () => {}
  app.mount('#app')
  await nextTick()
  await nextTick()
}
// Content that stays left-to-right on purpose: card digit groups would reverse under bidi; a one-time code's slots read like its digits; a discount's sign stays before its number; a switch lays out left to right and mirrors as a whole.
const LEFT_TO_RIGHT = 'input[autocomplete="cc-number"], [data-slot="input-otp-root"], [data-slot="price-discount-amount"], [data-slot="switch"]'
const pinnedLtr = () => [...document.querySelectorAll(`[dir="ltr"]:not(${LEFT_TO_RIGHT})`)].map((element) => element.getAttribute('data-slot') ?? element.tagName.toLowerCase())
const texts = (selector: string) => [...document.querySelectorAll(selector)].map((element) => element.textContent!.replace(/\s/g, ' ').trim())
afterEach(() => {
  app?.unmount()
  app = undefined
})

const price = { amount: 11980, currency: 'EUR' }
const tabs = () => h(Tabs, { defaultValue: 'a' }, () => h(TabsList, null, () => h(TabsTrigger, { value: 'a' }, () => 'A')))

describe('a root ConfigProvider', () => {
  it.each(Object.keys(demos).map((path) => [path.split('/').at(-2)!, path]))('runs every Reka part right-to-left in the %s demo when it says rtl', async (_, path) => {
    await mount(() => h(ConfigProvider, { dir: 'rtl' }, () => h(demos[path]!.default)))
    expect(pinnedLtr()).toEqual([])
  })

  it.each(Object.keys(demos).map((path) => [path.split('/').at(-2)!, path]))('runs every Reka part right-to-left in the %s demo opened', async (_, path) => {
    await mount(() => h(ConfigProvider, { dir: 'rtl' }, () => h(demos[path]!.default, { open: true })))
    expect(pinnedLtr()).toEqual([])
  })

  it('is optional: items run left-to-right and format in English without one', async () => {
    await mount(() => [h(Price, { price }), tabs()])
    expect(texts('[data-slot="price"] [data-slot="price-amount"], [data-slot="price"]')[0]).toContain('€119.80')
    expect(document.querySelector('[data-slot="tabs"]')!.getAttribute('dir')).toBe('ltr')
  })

  it('gives the items its direction and locale', async () => {
    await mount(() => h(ConfigProvider, { dir: 'rtl', locale: 'de-DE' }, () => [h(Price, { price }), tabs()]))
    expect(texts('[data-slot="price"]')[0]).toContain('119,80 €')
    expect(document.querySelector('[data-slot="tabs"]')!.getAttribute('dir')).toBe('rtl')
  })

  it("loses to an item's own locale, which a template hands to the items inside it", async () => {
    const items = [{ id: 'a', name: 'Parka', price: { amount: 14900, currency: 'EUR' }, quantity: 1 }]
    await mount(() => h(ConfigProvider, { locale: 'de-DE' }, () => [h(Price, { price, locale: 'en-US' }), h(CartFull, { items, locale: 'en-US' })]))
    const prices = texts('[data-slot="price"]')
    expect(prices.length).toBeGreaterThan(1)
    expect(prices.every((text) => text.includes('€') && !text.includes(' €'))).toBe(true)
  })

  it('is the only source: no item reads the page or an injection of its own for direction, locale or the overlay target', () => {
    const own = globSync('{ui,sections,templates,lib,composables}/**/*.{vue,ts}', { cwd: root }).filter((file) =>
      /useReadingDirection|usePortalTarget|fronticPortalTarget|ui\/direction'|documentElement\.dir/.test(readFileSync(join(root, file), 'utf8')),
    )
    expect(own).toEqual([])
  })
})

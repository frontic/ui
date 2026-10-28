// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import CartCompact from '../../templates/cart-compact/CartCompact.vue'
import CartFull from '../../templates/cart-full/CartFull.vue'
import CartItemCompact from '../../templates/cart-item-compact/CartItemCompact.vue'
import CartItemDetailed from '../../templates/cart-item-detailed/CartItemDetailed.vue'
import CartItemMinimal from '../../templates/cart-item-minimal/CartItemMinimal.vue'
import CartMinimal from '../../templates/cart-minimal/CartMinimal.vue'
import CheckoutPage from '../../templates/checkout-page/CheckoutPage.vue'
import OrderSummary from '../../sections/order-summary/OrderSummary.vue'
import type { CartLine } from '../../templates/cart-full/types'

const items: CartLine[] = [
  { id: '1', name: 'Sneakers', variant: 'White / 42', price: { amount: 12999, currency: 'EUR' }, quantity: 1, image: '/a.svg' },
  { id: '2', name: 'Tee', price: { amount: 3999, currency: 'EUR' }, quantity: 2 },
]
const render = async (...args: Parameters<typeof h>) => (await renderToString(h(...args))).replace(/<!--.*?-->/g, '')
const cardParts = (html: string) => [...html.matchAll(/data-slot="card-(?:header|content|footer)" class="([^"]*)"/g)].map((m) => m[1]!)

describe('cart and checkout cards', () => {
  // CardHeader, CardContent and CardFooter take their sides from their recipe, so a passed padding class would override it.
  it.each([
    ['cart-full', CartFull, { items }],
    ['order-summary', OrderSummary, { items }],
    ['checkout-page', CheckoutPage, { items }],
  ])('%s passes no padding to a Card part, which keeps its 32px sides', async (_, Item, props) => {
    const parts = cardParts(await render(Item, props))
    expect(parts.length).toBeGreaterThanOrEqual(2)
    for (const cls of parts) {
      expect(cls).toMatch(/(?:^|\s)fui-card-(?:header|content|footer)(?:\s|$)/)
      expect(cls).not.toMatch(/(?:^|\s)p[xytblr]?-\S+/)
    }
  })

  it('cart-full rules the total off inside its wrapper, so the summary keeps the default brand’s 12px above and below the rule', async () => {
    const html = await render(CartFull, { items })
    expect(html).toMatch(/<div data-slot="total" class="fui-total"><div [^>]*data-slot="separator"[^>]*><\/div><div class="flex justify-between pt-3">/)
  })

  it('checkout-page lists its lines through order-summary, with the code field above the totals', async () => {
    const html = await render(CheckoutPage, { items })
    expect(html.match(/data-slot="order-summary-image"/g)).toHaveLength(2)
    expect(html).toContain('Qty: 2')
    expect(html.indexOf('Enter a code')).toBeLessThan(html.indexOf('Subtotal'))
  })

  it('order-summary renders its own lines with Image and Price, and a template can drop its own line in', async () => {
    const own = await render(OrderSummary, { items })
    expect(own.match(/data-slot="order-summary-image"/g)).toHaveLength(2)
    expect(own).toContain('Qty: 2')
    const slotted = await render(OrderSummary, { items }, { line: ({ line }: { line: CartLine }) => h('b', line.name) })
    expect(slotted).toContain('<b>Sneakers</b><b>Tee</b>')
    expect(slotted).not.toContain('order-summary-image')
  })
})

describe('cart totals', () => {
  it.each([
    ['cart-full', CartFull],
    ['order-summary', OrderSummary],
    ['checkout-page', CheckoutPage],
  ])('%s totals in the lines’ currency when the currency prop is left at its default', async (_, Item) => {
    const html = await render(Item, { items: usd })
    expect(html).toContain('$')
    expect(html).not.toContain('€')
  })
})

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}
const usd = items.map((line) => ({ ...line, price: { ...line.price, currency: 'USD' } }))

describe('open carts', () => {
  it.each([
    ['cart-compact', CartCompact],
    ['cart-minimal', CartMinimal],
  ])('%s totals in the lines’ currency and hands its lines to checkout', async (_, Cart) => {
    const checkouts: CartLine[][] = []
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(Cart, { items: usd, onCheckout: (lines: CartLine[]) => checkouts.push(lines) }) }))
    app.mount('#app')
    await settle()
    ;(document.querySelector('#app button') as HTMLButtonElement).click()
    await settle()
    expect(document.body.textContent).toContain('$')
    expect(document.body.textContent).not.toContain('€')
    ;([...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Checkout') as HTMLButtonElement).click()
    await settle()
    expect(checkouts[0]?.map((line) => line.id)).toEqual(['1', '2'])
    app.unmount()
  })
})

describe('cart trigger count', () => {
  it.each([
    ['cart-compact', CartCompact],
    ['cart-minimal', CartMinimal],
  ])('%s caps its badge at 9+', async (_, Cart) => {
    const badge = (quantity: number) => render(Cart, { items: [{ ...items[1]!, quantity }] }).then((html) => /data-slot="badge"[^>]*>([^<]*)</.exec(html)?.[1])
    expect(await badge(9)).toBe('9')
    expect(await badge(12)).toBe('9+')
  })
})

describe('locale', () => {
  it.each([
    ['cart-item-minimal', CartItemMinimal],
    ['cart-full', CartFull],
    ['order-summary', OrderSummary],
    ['checkout-page', CheckoutPage],
  ])('%s formats every amount in the passed locale', async (_, Item) => {
    const html = (await render(Item, { items, locale: 'de-DE' })).replace(/<svg[\s\S]*?<\/svg>/g, '')
    expect(html).toContain('129,99')
    expect(html).not.toMatch(/\d\.\d\d\b/)
  })
})

describe('line images', () => {
  it.each([
    ['cart-item-detailed', CartItemDetailed],
    ['cart-item-compact', CartItemCompact],
    ['cart-item-minimal', CartItemMinimal],
  ])('%s keeps its frame from shrinking in a narrow row', async (look, Item) => {
    const html = await render(Item, { items })
    expect(html).toMatch(new RegExp(`data-slot="${look}-image" class="fui-${look}-image shrink-0 overflow-hidden"`))
  })
})

describe('remove buttons', () => {
  it.each([
    ['cart-item-detailed', CartItemDetailed],
    ['cart-item-compact', CartItemCompact],
  ])('%s rests muted through quiet-action on a neutral ghost Button', async (_, Item) => {
    const html = await render(Item, { items })
    const button = /<button [^>]*aria-label="Remove Tee"[^>]*>/.exec(html)?.[0]
    expect(button).toContain('data-slot="quiet-action"')
    expect(button).toMatch(/class="[^"]*\bfui-button-ghost\b/)
    expect(button).toMatch(/class="[^"]*\bfui-button-neutral\b/)
    expect(button).toMatch(/class="[^"]*\bfui-quiet-action\b/)
  })
})

describe('cart-item-detailed', () => {
  it('edits its lines through v-model:items: quantity within 1 and maxQuantity, and remove', async () => {
    const lines = ref<CartLine[]>(items.map((line) => ({ ...line })))
    document.body.innerHTML = '<div id="app"></div>'
    const app = createApp(defineComponent({ setup: () => () => h(CartItemDetailed, { items: lines.value, maxQuantity: 2, 'onUpdate:items': (next: CartLine[]) => (lines.value = next) }) }))
    app.mount('#app')
    await nextTick()
    const click = async (label: string, at = 0) => {
      ;(document.querySelectorAll(`[aria-label="${label}"]`)[at] as HTMLButtonElement).click()
      await nextTick()
    }
    await click('Increase quantity of Sneakers')
    expect(lines.value[0]!.quantity).toBe(2)
    await click('Increase quantity of Sneakers')
    expect(lines.value[0]!.quantity).toBe(2)
    await click('Remove Tee')
    expect(lines.value.map((line) => line.id)).toEqual(['1'])
    app.unmount()
  })
})

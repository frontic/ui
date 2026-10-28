// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Price, PriceDiscount } from '../../ui/price'

describe('a discount badge on a right-to-left page', () => {
  it('keeps the minus sign before the number, so -17% never reads 17%-', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(
      h(
        'div',
        { dir: 'rtl' },
        h(Price, { price: { amount: 13200, currency: 'EUR', ref: 15900 } }, () => h(PriceDiscount)),
      ),
    )
    const amount = host.querySelector('[data-slot="price-discount-amount"]')!
    expect([amount.getAttribute('dir'), amount.textContent]).toEqual(['ltr', '-17%'])
  })
})

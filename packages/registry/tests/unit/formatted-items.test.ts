// @vitest-environment happy-dom
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { OrderTracking } from '../../sections/order-tracking'
import { RecentOrders } from '../../sections/recent-orders'
import { Reviews } from '../../sections/reviews'
import { RatingMeta } from '../../ui/rating'

let app: ReturnType<typeof createApp> | undefined
const text = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.config.warnHandler = () => {}
  app.mount('#app')
  await nextTick()
  return document.body.textContent!.replace(/\s+/g, ' ')
}
afterEach(() => {
  app?.unmount()
  app = undefined
})

describe('dates an item is given as ISO strings', () => {
  it('print formatted in the locale, not raw', async () => {
    const reviews = await text(() => h(Reviews, { rating: 4, total: 1, reviews: [{ author: 'Mia', date: '2026-03-01', rating: 4, content: 'Warm.' }] }))
    expect(reviews).toContain('Mar 1, 2026')
    expect(reviews).not.toContain('2026-03-01')
    app!.unmount()
    const orders = await text(() => h(RecentOrders, { orders: [{ number: '#1', date: '2026-03-01', status: 'shipped', items: ['Parka'], total: { amount: 100, currency: 'EUR' } }] }))
    expect(orders).toContain('Mar 1, 2026')
    expect(orders).not.toContain('2026-03-01')
    app!.unmount()
    const tracking = await text(() => h(ConfigProvider, { locale: 'de-DE' }, () => h(OrderTracking, { title: 'Order', current: 1, steps: [{ title: 'Ordered', date: '2026-03-01' }] })))
    expect(tracking).toContain('1. März')
    expect(tracking).not.toContain('2026-03-01')
  })
})

describe('a rating', () => {
  it('shows one decimal, in the locale', async () => {
    expect(await text(() => h(RatingMeta, { rating: 4, max: 5 }))).toContain('4.0/5')
    app!.unmount()
    expect(await text(() => h(RatingMeta, { rating: 4.5, max: 5, locale: 'de-DE' }))).toContain('4,5/5')
    app!.unmount()
    expect(await text(() => h(ConfigProvider, { locale: 'de-DE' }, () => h(Reviews, { rating: 4.25, total: 3 })))).toContain('4,3')
  })
})

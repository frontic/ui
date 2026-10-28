// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { RecentOrders, type RecentOrder } from '../../sections/recent-orders'
import Demo from '../../sections/recent-orders/recent-orders.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (component: unknown, props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  const events: string[] = []
  app = createApp({ render: () => h(component as never, { onDownloadAll: () => events.push('downloadAll'), ...props }) })
  app.mount('#app')
  await nextTick()
  return events
}
afterEach(() => app?.unmount())

const orders: RecentOrder[] = [{ number: '#FR-20418', date: '2026-10-06', status: 'processing', items: ['Blizzard Defender'], total: { amount: 12600, currency: 'EUR' } }]
const download = () => document.querySelectorAll<HTMLButtonElement>('[data-slot=card-action] button')

describe('recent orders', () => {
  it('names the card in a heading', async () => {
    await mount(RecentOrders, { orders })
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Recent orders')
  })

  it('keeps the download button beside the heading at every width', async () => {
    await mount(RecentOrders, { orders })
    expect([...document.querySelector('[data-slot=card-action]')!.classList]).toEqual(expect.arrayContaining(['col-start-2', 'row-start-1']))
  })

  it('says there are no orders and keeps the download off', async () => {
    const events = await mount(RecentOrders, { orders: [] })
    expect(document.querySelector('[data-slot=card-content]')!.textContent).toContain('You have no orders yet.')
    expect(document.querySelector('table')).toBeNull()
    expect([...download()].every((b) => b.disabled)).toBe(true)
    download()[0]!.click()
    expect(events).toEqual([])
  })

  it('keeps the table while a page of a non-empty history is still empty, e.g. loading', async () => {
    await mount(RecentOrders, { orders: [], total: 23, page: 3, pageSize: 10 })
    expect(document.body.textContent).not.toContain('You have no orders yet.')
    expect(document.body.textContent).not.toContain('Showing')
    expect(document.querySelector('table')).not.toBeNull()
  })
})

describe('the recent orders demo', () => {
  it('dates every order on every page', async () => {
    await mount(Demo)
    const dates: string[] = []
    for (let page = 1; page <= 5; page++) {
      if (page > 1) {
        document.querySelector<HTMLElement>(`[data-slot=pagination-item][aria-label="Page ${page}"]`)!.click()
        await nextTick()
      }
      dates.push(...[...document.querySelectorAll('td.hidden time')].map((t) => t.getAttribute('datetime')!))
    }
    expect(dates).toHaveLength(23)
    expect(dates.filter((d) => Number.isNaN(Date.parse(d)))).toEqual([])
  })
})

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ReturnRequest, type ReturnItem } from '../../sections/return-request'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  const sent: unknown[] = []
  app = createApp({ render: () => h(ReturnRequest, { items, onSubmit: (request: unknown) => sent.push(request), ...props }) })
  app.mount('#app')
  await nextTick()
  return sent
}
afterEach(() => app?.unmount())

const items: ReturnItem[] = [
  { id: 'jacket', name: 'Northern Light Hybrid Jacket', price: { amount: 11500, currency: 'EUR' } },
  { id: 'pouch', name: 'Gift pouch', price: { amount: 0, currency: 'EUR' } },
  { id: 'goggles', name: 'Mountain View Ski Goggles', price: { amount: 6695, currency: 'EUR' }, returnable: false },
]
const refundMethods = [
  { value: 'original', label: 'Visa •• 4242' },
  { value: 'credit', label: 'Store credit' },
]
const submit = () => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Request return'))!

describe('return request', () => {
  it('names the card in a heading', async () => {
    await mount({})
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Start a return')
  })

  it('sends the reason and refund method it shows when the shopper left them as they were', async () => {
    const sent = await mount({ selected: ['jacket'], refundMethods })
    submit().click()
    expect(sent).toEqual([{ items: ['jacket'], reason: 'fit', comment: '', refundTo: 'original' }])
  })

  it('lets the shopper return an item that cost nothing', async () => {
    const sent = await mount({ selected: ['pouch'] })
    expect(submit().disabled).toBe(false)
    submit().click()
    expect(sent).toHaveLength(1)
  })

  it('keeps the request off until an item is picked', async () => {
    await mount({})
    expect(submit().disabled).toBe(true)
  })

  it('dims the price of an item that cannot be returned, with its name', async () => {
    await mount({})
    const row = [...document.querySelectorAll('[data-slot=field]')].find((f) => f.textContent!.includes('Goggles'))!
    expect(row.getAttribute('data-disabled')).not.toBeNull()
    expect(row.querySelector('[data-slot=price]')!.classList).toContain('group-data-disabled/field:fui-disabled')
  })
})

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { OrderTracking } from '../../sections/order-tracking'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const steps = [
  { title: 'Ordered', date: '2026-10-02', note: 'Payment confirmed' },
  { title: 'Shipped', date: '2026-10-05', note: 'Left the sorting centre' },
  { title: 'Delivered', note: 'Expected by Oct 9' },
]

describe('order-tracking', () => {
  it('leads with the arrival and lists the steps as a timeline: title and date in one row, a note under each', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(OrderTracking, { title: 'Order', steps, current: 2, eta: 'Arriving Friday' }) })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('[data-slot="stepper"]')!.getAttribute('data-orientation')).toBe('vertical')
    expect(document.querySelector('[data-slot="order-tracking-eta"]')!.textContent).toBe('Arriving Friday')
    const rows = [...document.querySelectorAll('[data-slot="stepper-item"]')].map((item) => [
      item.querySelector('[data-slot="stepper-title"] [data-slot="meta"]')?.textContent ?? null,
      item.querySelector('[data-slot="stepper-description"]')?.textContent,
    ])
    expect(rows).toEqual([
      ['Oct 2', 'Payment confirmed'],
      ['Oct 5', 'Left the sorting centre'],
      [null, 'Expected by Oct 9'],
    ])
    expect(document.querySelector('[role="progressbar"]')).toBeNull()
  })
})

// @vitest-environment happy-dom
import { CalendarDate } from '@internationalized/date'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { DeliverySlot, type DeliveryWindow } from '../../sections/delivery-slot'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  const confirmed: unknown[] = []
  app = createApp({ render: () => h(DeliverySlot, { windows, onConfirm: (slot: unknown) => confirmed.push(slot), ...props }) })
  app.mount('#app')
  await nextTick()
  return confirmed
}
afterEach(() => app?.unmount())

const windows: DeliveryWindow[] = [
  { value: '08-12', label: '8–12' },
  { value: '18-21', label: '18–21', full: true },
]
const day = new CalendarDate(2026, 10, 14)
const confirm = async () => {
  ;[...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent!.trim() === 'Confirm delivery slot')!.click()
  await nextTick()
}
const windowButton = (label: string) => document.querySelector<HTMLElement>(`[data-slot=toggle-group-item][aria-label^="Between ${label}"]`)!
const errors = () => [...document.querySelectorAll('[data-slot=field-error]')].map((e) => e.textContent!.trim())

describe('delivery slot', () => {
  it('names the card in a heading', async () => {
    await mount()
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Delivery')
  })

  it('shows an icon on each delivery speed', async () => {
    await mount()
    expect([...document.querySelectorAll('[data-slot=tabs-trigger]')].map((t) => t.querySelectorAll('[data-icon], svg').length > 0)).toEqual([true, true])
  })

  it('reads a fully booked window as fully booked', async () => {
    await mount()
    expect(windowButton('18–21').getAttribute('aria-label')).toBe('Between 18–21, Fully booked')
    expect(windowButton('8–12').getAttribute('aria-label')).toBe('Between 8–12')
  })

  it('asks for a day and a window before confirming standard delivery, then sends both', async () => {
    const confirmed = await mount()
    await confirm()
    expect(confirmed).toEqual([])
    expect(errors()).toEqual(['Choose a day', 'Choose a time window'])
    windowButton('8–12').click()
    await nextTick()
    expect(errors()).toEqual(['Choose a day'])
    app!.unmount()
    const again = await mount({ day, window: '08-12' })
    await confirm()
    expect(again).toEqual([{ speed: 'standard', day, window: '08-12' }])
  })

  it('keeps a window the shopper chose when they press it again', async () => {
    await mount()
    windowButton('8–12').click()
    await nextTick()
    windowButton('8–12').click()
    await nextTick()
    expect(windowButton('8–12').dataset.state).toBe('on')
  })

  it('sends only the speed for express delivery', async () => {
    const confirmed = await mount({ speed: 'express', day, window: '08-12' })
    await confirm()
    expect(confirmed).toEqual([{ speed: 'express' }])
  })
})

describe('the delivery slot price', () => {
  const priceOf = async (props: Record<string, unknown>) => {
    await mount({ locale: 'en-GB', ...props })
    return document.querySelector('[data-slot="delivery-slot-price"]')?.textContent ?? null
  }

  it('formats the price it is given in the slot’s locale', async () => {
    expect(await priceOf({ price: { amount: 495, currency: 'EUR' } })).toBe('€4.95')
  })

  it('reads free at 0, in its own words', async () => {
    expect(await priceOf({ price: { amount: 0, currency: 'EUR' } })).toBe('Free')
    app!.unmount()
    expect(await priceOf({ price: { amount: 0, currency: 'EUR' }, freeLabel: 'Kostenlos' })).toBe('Kostenlos')
  })

  it('shows none without a price', async () => {
    expect(await priceOf({})).toBeNull()
  })
})

describe('the delivery slot day', () => {
  it('centres its calendar in the Field, as wide as the month', async () => {
    await mount({ locale: 'en-GB' })
    const calendar = document.querySelector<HTMLElement>('[data-slot="calendar"]')!
    expect(calendar.parentElement!.dataset.slot).toBe('field')
    expect([...calendar.classList]).toContain('self-center')
  })
})

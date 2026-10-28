// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ShippingAddress } from '../../sections/shipping-address'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(ShippingAddress, { countries, ...props }) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const countries = [
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
]

describe('shipping address', () => {
  it('names the card in a heading and keeps the step beside it at every width', async () => {
    await mount({ step: 'Step 2 of 4' })
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Shipping address')
    expect([...document.querySelector('[data-slot=card-action]')!.classList]).toEqual(expect.arrayContaining(['col-start-2', 'row-start-1']))
  })

  it('asks for a country instead of showing one the shopper did not pick', async () => {
    await mount()
    const select = document.querySelector('select')!
    expect(select.value).toBe('')
    expect(select.selectedOptions[0]!.textContent).toBe('Choose a country')
    expect(select.selectedOptions[0]!.disabled).toBe(true)
  })

  it('requires every address field before it continues', async () => {
    await mount()
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('form input:not([type=checkbox]):not([aria-hidden]), form select')]
    expect(controls).toHaveLength(6)
    expect(controls.filter((c) => !c.required)).toEqual([])
  })

  it('tells autofill the fields are the shipping address', async () => {
    await mount()
    const tokens = [...document.querySelectorAll('form [autocomplete]')].map((c) => c.getAttribute('autocomplete'))
    expect(tokens).toEqual(['shipping given-name', 'shipping family-name', 'shipping address-line1', 'shipping postal-code', 'shipping address-level2', 'shipping country'])
  })
})

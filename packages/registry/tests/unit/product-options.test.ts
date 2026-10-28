// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ProductOptions } from '../../sections/product-options'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  const added: unknown[] = []
  app = createApp({ render: () => h(ProductOptions, { title: 'Blizzard Defender', price: { amount: 12600, currency: 'EUR' }, onAddToCart: (s: unknown) => added.push(s), ...props }) })
  app.mount('#app')
  await nextTick()
  return added
}
afterEach(() => app?.unmount())

const sizes = [{ value: 'S' }, { value: 'M' }]
const sizeButton = (value: string) => document.querySelector<HTMLElement>(`[data-slot=toggle-group-item][aria-label="Size ${value}"]`)!
const addToCart = async () => {
  ;[...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent!.trim() === 'Add to cart')!.click()
  await nextTick()
}

describe('product options', () => {
  it('names the product in a heading', async () => {
    await mount({})
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Blizzard Defender')
  })

  it('keeps the wishlist heart beside the title at every width', async () => {
    await mount({})
    expect([...document.querySelector('[data-slot=card-action]')!.classList]).toEqual(expect.arrayContaining(['col-start-2', 'row-span-2', 'row-start-1', 'justify-self-end']))
  })

  it('keeps the chosen size when the shopper presses it again', async () => {
    await mount({ sizes, size: 'M' })
    sizeButton('M').click()
    await nextTick()
    expect(sizeButton('M').dataset.state).toBe('on')
  })

  it('keeps a size the shopper chose themselves when they press it again', async () => {
    const added = await mount({ sizes })
    sizeButton('S').click()
    await nextTick()
    sizeButton('S').click()
    await nextTick()
    expect(sizeButton('S').dataset.state).toBe('on')
    await addToCart()
    expect(added).toEqual([{ colour: undefined, size: 'S', quantity: 1 }])
  })

  it('asks for a size instead of adding to the cart before one is chosen, and clears the ask once one is', async () => {
    const added = await mount({ sizes })
    await addToCart()
    expect(added).toEqual([])
    expect(document.querySelector('[data-slot=field-error]')!.textContent!.trim()).toBe('Choose a size')
    sizeButton('S').click()
    await nextTick()
    expect(document.querySelector('[data-slot=field-error]')).toBeNull()
    await addToCart()
    expect(added).toEqual([{ colour: undefined, size: 'S', quantity: 1 }])
  })

  it('adds to the cart without a size when the product has none', async () => {
    const added = await mount({})
    await addToCart()
    expect(added).toEqual([{ colour: undefined, size: undefined, quantity: 1 }])
  })

  it('crosses out a sold-out colour, keeps it selectable, and asks for another before adding to the cart', async () => {
    const colours = [
      { value: 'aubergine', label: 'Aubergine', hex: '#3d3347' },
      { value: 'salmon', label: 'Salmon', hex: '#dc967b', unavailable: true },
    ]
    const added = await mount({ colours, colour: 'salmon' })
    const salmon = document.querySelector('[data-slot=swatch-group-item][data-unavailable]')!
    expect(salmon.closest('label')!.textContent).toContain('Salmon, Sold out')
    expect(salmon.getAttribute('data-state')).toBe('on')
    await addToCart()
    expect(added).toEqual([])
    expect(document.querySelector('[data-slot=field-error]')!.textContent!.trim()).toBe('Sold out')
    document.querySelector<HTMLElement>('[data-slot=swatch-group-item]:not([data-unavailable])')!.click()
    await nextTick()
    expect(document.querySelector('[data-slot=field-error]')).toBeNull()
    await addToCart()
    expect(added).toEqual([{ colour: 'aubergine', size: undefined, quantity: 1 }])
  })

  it('formats the price in the locale it is given', async () => {
    await mount({ locale: 'de-DE' })
    expect(document.querySelector('[data-slot=price]')!.textContent).toContain('126,00')
  })
})

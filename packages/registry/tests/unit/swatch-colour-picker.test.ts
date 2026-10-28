// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import ColourPicker from '../../ui/swatch/swatch.colour-picker.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

async function mount() {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(() => h(ColourPicker))
  app.mount('#app')
  await nextTick()
  const items = [...document.querySelectorAll<HTMLElement>('[data-slot="swatch-group-item"]')]
  // A swatch's name sits in the label around its button.
  const name = (item: HTMLElement) => item.closest('label')!.textContent!.replace(/\s+/g, ' ').trim()
  const on = () => items.filter((item) => item.getAttribute('data-state') === 'on').map(name)
  return { items, on, name }
}

it('picks one colour of the jacket, the photo swatch first', async () => {
  const { items, on, name } = await mount()
  expect(items.map(name)).toEqual(['Aubergine', 'Charcoal', 'Slate blue', 'Dusty pink, Sold out'])
  expect(on()).toEqual(['Aubergine'])
  expect(items[0]!.querySelector('[data-slot="swatch-image"]')?.getAttribute('src')).toContain('blizzard-defender-aubergine')

  items[1]!.click()
  await nextTick()
  expect(on()).toEqual(['Charcoal'])
})

it('strikes the sold-out colour through and still lets it be picked, as Swatch documents', async () => {
  const { items, on } = await mount()
  const soldOut = items[3]!
  expect(soldOut.getAttribute('data-unavailable')).toBe('true')
  expect(soldOut.querySelector('[data-slot="swatch-strike"]')).not.toBeNull()

  soldOut.click()
  await nextTick()
  expect(on()).toEqual(['Dusty pink, Sold out'])
})

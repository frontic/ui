// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import AutocompleteDemo from '../../ui/autocomplete/autocomplete.example.vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const groups = () =>
  [...document.querySelectorAll('[data-slot="autocomplete-group"]')].map((group) => ({
    heading: group.querySelector('.fui-autocomplete-label')?.textContent?.trim(),
    items: group.querySelectorAll('[data-slot="autocomplete-item"]').length,
  }))

const suggestionCount = () => groups().find((group) => group.heading === 'Suggestions')?.items ?? 0

it("drops a lookup's results once the query has moved on, so a slow answer never fills the list for newer text", async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(AutocompleteDemo))
  app.mount('#app')
  const input = document.querySelector('input')!
  const type = async (value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
  }
  await type('Ha')
  await wait(50)
  await type('H')
  await wait(400)
  expect(suggestionCount()).toBe(0)
  await type('Ha')
  await wait(400)
  expect(suggestionCount()).toBeGreaterThan(0)
  app.unmount()
})

it('opens on the chevron with the saved addresses, and separates them from the suggestions once there are some', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(AutocompleteDemo))
  app.mount('#app')
  document.querySelector<HTMLElement>('[data-slot="autocomplete-trigger"]')!.click()
  await wait(50)
  expect(groups()).toEqual([{ heading: 'Saved addresses', items: 2 }])
  expect(document.querySelector('[data-slot="autocomplete-separator"]')).toBeNull()
  const input = document.querySelector('input')!
  input.value = 'Mu'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await wait(400)
  expect(groups()).toEqual([
    { heading: 'Saved addresses', items: 1 },
    { heading: 'Suggestions', items: 2 },
  ])
  expect(document.querySelectorAll('[data-slot="autocomplete-separator"]')).toHaveLength(1)
  app.unmount()
})

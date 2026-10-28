// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import ReviewCards from '../../sections/review-cards/ReviewCards.vue'
import HeaderCentered from '../../templates/header-centered/HeaderCentered.vue'
import HeaderShop from '../../templates/header-shop/HeaderShop.vue'

const clickEmit = async (Item: object, handler: string, label: string) => {
  const fired: unknown[][] = []
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(defineComponent({ setup: () => () => h(Item, { [handler]: (...args: unknown[]) => fired.push(args) }) }))
  app.mount('#app')
  await nextTick()
  const target = [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label)
  expect(target, label).toBeTruthy()
  target!.click()
  await nextTick()
  app.unmount()
  return fired
}

describe('header buttons', () => {
  it.each([
    ['header-shop', HeaderShop],
    ['header-centered', HeaderCentered],
  ])('%s emits search, account and cart from its buttons', async (_, Item) => {
    expect(await clickEmit(Item, 'onSearch', 'Search')).toHaveLength(1)
    expect(await clickEmit(Item, 'onAccount', 'Account')).toHaveLength(1)
    expect(await clickEmit(Item, 'onCart', 'Cart')).toHaveLength(1)
  })
})

describe('review-cards', () => {
  it('emits write-review from its button', async () => {
    expect(await clickEmit(ReviewCards, 'onWriteReview', 'Write a review')).toHaveLength(1)
  })
})

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { Skeleton } from '../../ui/skeleton'
import SkeletonDemo from '../../ui/skeleton/skeleton.example.vue'

const mount = async (component: Parameters<typeof createApp>[0]) => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(component)
  app.mount('#app')
  await nextTick()
  return app
}

describe('a skeleton', () => {
  it('pulses on its recipe and holds still when the shopper asks for reduced motion', async () => {
    const app = await mount(Skeleton)
    expect(document.querySelector('[data-slot="skeleton"]')!.className.split(' ')).toEqual(expect.arrayContaining(['fui-skeleton', 'animate-pulse', 'motion-reduce:animate-none']))
    app.unmount()
  })
})

describe('the skeleton demo', () => {
  it('stands in for a product card: a flush image, then the card’s lines, busy, announced from outside the busy card', async () => {
    const app = await mount(SkeletonDemo)
    const card = document.querySelector('[data-slot="card"]')!
    expect(card.getAttribute('aria-busy')).toBe('true')
    expect(card.firstElementChild!.getAttribute('data-slot')).toBe('card-image')
    expect(card.querySelector('[role="status"]')).toBeNull()
    expect(card.parentElement!.querySelector(':scope > [role="status"]')!.textContent).toBe('Loading product')
    expect(card.querySelectorAll('[data-slot="skeleton"]').length).toBe(9)
    app.unmount()
  })
})

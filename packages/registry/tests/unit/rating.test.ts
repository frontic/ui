// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Rating } from '../../ui/rating'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())
const $ = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!

describe('a Rating', () => {
  it('hides each mark from screen readers without a Vue warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mount(() => h(Rating, { rating: 3, shape: 'star' }))
    expect([...document.querySelectorAll('[data-slot="rating-icon"]')].every((mark) => mark.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(warn.mock.calls.flat().join('\n')).not.toMatch(/Extraneous non-props attributes/)
    warn.mockRestore()
  })

  it('says the score once, with the review count, and hides the score text it shows', async () => {
    await mount(() => h(Rating, { rating: 4.3, count: 128, showValue: true }))
    expect($('rating-stars').getAttribute('aria-label')).toBe('4.3 out of 5, 128 reviews')
    expect($('rating-meta').getAttribute('aria-hidden')).toBe('true')
    expect($('rating-value').textContent).toBe('4.3/5')
    expect($('rating-count').textContent).toBe('(128)')
  })

  it('leaves the review count out when the score text is not shown', async () => {
    await mount(() => h(Rating, { rating: 4.3, count: 128 }))
    expect($('rating-stars').getAttribute('aria-label')).toBe('4.3 out of 5')
  })

  it('keeps meta slot content readable and offset like the score text', async () => {
    await mount(() => h(Rating, { rating: 4, label: (filled: number, max: number) => `Rated ${filled} of ${max}` }, { meta: () => '(86)' }))
    expect($('rating-stars').getAttribute('aria-label')).toBe('Rated 4 of 5')
    expect($('rating-meta').hasAttribute('aria-hidden')).toBe(false)
    expect($('rating-meta').classList.contains('fui-rating-meta')).toBe(true)
    expect($('rating-count').textContent).toBe('(86)')
  })

  it('spaces its marks and score text through recipes', async () => {
    await mount(() => h(Rating, { rating: 4, count: 9, showValue: true, shape: 'star' }))
    expect($('rating').classList.contains('fui-rating')).toBe(true)
    expect($('rating-stars').classList.contains('fui-rating-stars-star')).toBe(true)
    expect($('rating-value').classList.contains('fui-rating-value')).toBe(true)
    expect(document.querySelector('[class*="gap-"], [class*="ml-"]')).toBeNull()
  })
  it('says one review in the singular', async () => {
    await mount(() => h(Rating, { rating: 5, count: 1, showValue: true }))
    expect($('rating-stars').getAttribute('aria-label')).toBe('5 out of 5, 1 review')
  })

  it('reads the score text once the meta slot goes away', async () => {
    const slotted = ref(true)
    await mount(() => h(Rating, { rating: 4, count: 12, showValue: true }, slotted.value ? { meta: () => '(12)' } : {}))
    expect($('rating-stars').getAttribute('aria-label')).toBe('4 out of 5')
    slotted.value = false
    await nextTick()
    expect($('rating-value').textContent).toBe('4.0/5')
    expect($('rating-stars').getAttribute('aria-label')).toBe('4 out of 5, 12 reviews')
  })

  it('prints the score to one decimal, as it reads it', async () => {
    await mount(() => h(Rating, { rating: 4.333, count: 9, showValue: true }))
    expect($('rating-value').textContent).toBe('4.3/5')
    expect($('rating-stars').getAttribute('aria-label')).toBe('4.3 out of 5, 9 reviews')
  })
})

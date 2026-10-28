// @vitest-environment happy-dom
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ReviewCards, type ReviewItem } from '../../sections/review-cards'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>, locale?: string) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => (locale ? h(ConfigProvider, { locale }, () => h(ReviewCards, props)) : h(ReviewCards, props)) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const reviews: ReviewItem[] = [{ id: 'r1', author: 'Marta K.', date: '2026-10-04', rating: 5, content: 'Stayed warm all week.', verified: true }]

describe('review cards', () => {
  it('formats the average and dates in the ConfigProvider’s locale when given none', async () => {
    await mount({ average: 4.6, totalCount: 212, reviews }, 'de-DE')
    expect(document.querySelector('[data-slot=review-cards-average]')!.textContent).toBe('4,6')
    expect(document.querySelector('time')!.textContent).toBe('4. Okt. 2026')
  })

  it('gives each review its own article', async () => {
    await mount({ reviews })
    expect(document.querySelectorAll('article')).toHaveLength(1)
  })

  it('says there are no reviews yet', async () => {
    await mount({})
    expect(document.body.textContent).toContain('No reviews yet.')
    expect(document.querySelector('article')).toBeNull()
  })
})

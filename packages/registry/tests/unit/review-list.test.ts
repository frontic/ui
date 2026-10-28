// @vitest-environment happy-dom
import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ReviewList, type ReviewItem } from '../../sections/review-list'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>, locale?: string) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => (locale ? h(ConfigProvider, { locale }, () => h(ReviewList, props)) : h(ReviewList, props)) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const reviews: ReviewItem[] = [{ id: 'r1', author: 'Marta K.', date: '2026-10-04', rating: 5, content: 'Stayed warm all week.', verified: true }]

describe('review list', () => {
  it('dates the reviews in the ConfigProvider’s locale when given none', async () => {
    await mount({ reviews }, 'de-DE')
    expect(document.querySelector('time')!.textContent).toBe('4. Oktober 2026')
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

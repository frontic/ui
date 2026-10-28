import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ReviewCards from '../../sections/review-cards/ReviewCards.vue'
import ReviewList from '../../sections/review-list/ReviewList.vue'
import Reviews from '../../sections/reviews/Reviews.vue'

const reviews = [
  { id: '1', author: 'Emily Selman', rating: 5, date: '2025-01-16', content: 'One' },
  { id: '2', author: 'Hector Gibbons', rating: 4, date: '2025-01-12', content: 'Two' },
  { id: '3', author: 'Mark Edwards', rating: 4, date: '2025-01-06', content: 'Three' },
]
const render = async (...args: Parameters<typeof h>) => (await renderToString(h(...args))).replace(/<!--.*?-->/g, '')
const separators = (html: string) => html.match(/data-slot="separator"/g)?.length ?? 0

describe('reviews', () => {
  it('review-cards puts one Separator between reviews, in block flow beside the padded review, with no divide-y', async () => {
    const html = await render(ReviewCards, { reviews })
    expect(separators(html)).toBe(2)
    expect(html).not.toContain('divide-y')
    expect(html).toMatch(/<div class="-my-8"><article class="py-8">.*?<\/p><\/article><div [^>]*data-slot="separator"[^>]*><\/div><article class="py-8">/)
  })

  it('review-cards has no separator for a single review', async () => {
    expect(separators(await render(ReviewCards, { reviews: reviews.slice(0, 1) }))).toBe(0)
  })

  it('review-list puts the Separator above the padded content of every review but the first, and the avatar column stays unruled', async () => {
    const html = await render(ReviewList, { reviews })
    expect(separators(html)).toBe(2)
    expect(html).not.toContain('border-t')
    expect(html).toMatch(/<div class="min-w-0 flex-1"><div [^>]*data-slot="separator"[^>]*><\/div><div class="flex flex-col gap-3 py-8">/)
    expect(html.match(/<div class="min-w-0 flex-1"><div class="flex flex-col gap-3 py-8">/g)).toHaveLength(1)
  })

  it('review-list keeps the avatar column padded 32px top and bottom beside the content', async () => {
    const html = await render(ReviewList, { reviews: reviews.slice(0, 1) })
    expect(html).toContain('<div class="shrink-0 py-8">')
  })
})

describe('review summaries', () => {
  const distribution = [
    { stars: 5, count: 3 },
    { stars: 1, count: 1 },
  ]
  const marks = (html: string) => html.match(/data-slot="rating-(dot|icon)"/g)?.length ?? 0
  const labels = (html: string) => [...html.matchAll(/<span data-slot="reviews-stars" class="([^"]*)">(.*?)<\/span><div/g)]

  it('reviews shows the average and the histogram as numbers alone, tabular so 1 and 5 line up', async () => {
    const html = await render(Reviews, { rating: 4.6, total: 4, distribution })
    expect(marks(html)).toBe(0)
    expect(labels(html).map(([, cls, inner]) => [cls.includes('tabular-nums'), inner.trim()])).toEqual([
      [true, '5'],
      [true, '1'],
    ])
  })

  it('reviews draws each review’s rating with the chosen mark', async () => {
    const one = [{ id: '1', author: 'A', rating: 4, content: 'C' }]
    expect(await render(Reviews, { rating: 4.6, total: 1, reviews: one, ratingShape: 'dot' })).toMatch(/^(?!.*rating-icon).*data-slot="rating-dot"/s)
    expect(marks(await render(Reviews, { rating: 4.6, total: 1, reviews: one }))).toBe(5)
  })

  it('review-cards shows the average and the histogram without marks; each review keeps its rating', async () => {
    const counts = [
      { rating: 5, count: 2 },
      { rating: 4, count: 1 },
    ]
    expect(marks(await render(ReviewCards, { counts }))).toBe(0)
    expect(marks(await render(ReviewCards, { counts, reviews: reviews.slice(0, 1) }))).toBe(5)
  })
})

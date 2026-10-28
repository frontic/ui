// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import Rating from '../../ui/rating/Rating.vue'

describe('rating', () => {
  it('renders a filled meta slot inside the rating-count part of rating-meta, after the stars, with its props', async () => {
    const html = await renderToString(
      h(Rating, { rating: 4, count: 12, showValue: true }, { meta: (p: { rating: number; max: number; count?: number }) => h('b', `${p.rating}/${p.max} of ${p.count}`) }),
    )
    expect(html).toMatch(/<span data-slot="rating-count" class="fui-rating-count[^"]*">(?:<!--\[-->)?<b>4\/5 of 12<\/b>(?:<!--\]-->)?<\/span>/)
    expect(html.indexOf('rating-count')).toBeGreaterThan(html.lastIndexOf('data-slot="rating-dot"'))
    expect(html).toMatch(/<span data-slot="rating-meta" class="fui-rating-meta[^"]*"><span data-slot="rating-count"/)
  })

  it('keeps showValue on RatingMeta when the slot is empty', async () => {
    const html = await renderToString(h(Rating, { rating: 4, count: 12, showValue: true }))
    expect(html).toContain('data-slot="rating-meta"')
    expect(html).toContain('<span data-slot="rating-value" class="fui-rating-value">4.0/5</span>')
    expect(html).toContain('(12)')
  })

  it('renders no count part without the slot or showValue', async () => {
    expect(await renderToString(h(Rating, { rating: 4 }))).not.toContain('rating-count')
  })
})

describe('rating, read by assistive tech', () => {
  const parse = (html: string) => {
    const host = document.createElement('div')
    host.innerHTML = html
    return host
  }

  it('keeps the slot content outside the role="img" element, which still carries the aria-label', async () => {
    const host = parse(await renderToString(h(Rating, { rating: 4, label: () => 'Four stars' }, { meta: () => h('b', '(12)') })))
    const img = host.querySelector('[role="img"]')!
    expect(img.getAttribute('aria-label')).toBe('Four stars')
    expect(img.querySelectorAll('[data-slot="rating-icon"]')).toHaveLength(5)
    const count = host.querySelector('b')!
    expect(img.contains(count)).toBe(false)
    expect(host.querySelector('[data-slot="rating"]')!.contains(count)).toBe(true)
  })

  it('keeps showValue text outside the role="img" element', async () => {
    const host = parse(await renderToString(h(Rating, { rating: 4, count: 12, showValue: true })))
    expect(host.querySelector('[role="img"]')!.contains(host.querySelector('[data-slot="rating-meta"]'))).toBe(false)
  })

  it('puts a passed class on the outer rating row', async () => {
    const host = parse(await renderToString(h(Rating, { rating: 4, class: 'mt-1' })))
    expect(host.querySelector('[data-slot="rating"]')!.classList.contains('mt-1')).toBe(true)
    expect(host.querySelector('[role="img"]')!.classList.contains('mt-1')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { FilterPrice, FilterRating, FilterSlider } from '../../ui/filter'
import { Rating } from '../../ui/rating'

const render = (node: () => unknown) => renderToString(createSSRApp({ render: node }))

describe('function-typed copy props', () => {
  it('name the rating by default and with a passed label', async () => {
    expect(await render(() => h(Rating, { rating: 4 }))).toContain('aria-label="4 out of 5"')
    expect(await render(() => h(Rating, { rating: 3, label: (f: number, m: number) => `${f} von ${m}` }))).toContain('aria-label="3 von 5"')
  })

  it('name every filter rating star', async () => {
    const html = await render(() => h(FilterRating, { max: 2 }))
    expect(html).toContain('aria-label="1 star and up"')
    expect(html).toContain('aria-label="2 stars and up"')
  })

  it('show "Up to" text on a single-thumb price and slider', async () => {
    const price = await render(() => h(FilterPrice, { value: { to: 5000 } }))
    expect(price).toMatch(/Up to [^<]*50/)
    expect(price).not.toContain('=&gt;')
    const slider = await render(() => h(FilterSlider, { value: { to: 40 } }))
    expect(slider).toContain('Up to 40')
    expect(slider).not.toContain('=&gt;')
  })
})

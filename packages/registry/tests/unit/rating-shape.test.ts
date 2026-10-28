// @vitest-environment happy-dom
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import Rating from '../../ui/rating/Rating.vue'

const marks = async (props: Record<string, unknown>) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(Rating, { rating: 4, ...props }))
  return [...host.querySelectorAll('[role="img"] > *')].map((el) => `${el.getAttribute('data-slot')} ${el.getAttribute('class')}`)
}

describe('rating shape', () => {
  it('draws stars by default', async () => {
    expect((await marks({})).map((m) => m.split(' ')[0])).toEqual(Array(5).fill('rating-icon'))
  })

  it('draws dots when asked, filled up to the score and empty after it', async () => {
    expect(await marks({ shape: 'dot' })).toEqual([
      ...Array(4).fill('rating-dot fui-rating-dot fui-rating-dot-full fui-rating-dot-md'),
      'rating-dot fui-rating-dot fui-rating-dot-empty fui-rating-dot-md',
    ])
  })

  it('fills stars and leaves them empty the same way', async () => {
    const stars = await marks({ shape: 'star', size: 'sm' })
    expect(stars.map((m) => m.split(' ')[0])).toEqual(Array(5).fill('rating-icon'))
    expect(stars[3]).toContain('fui-rating-icon-full fui-rating-icon-sm')
    expect(stars[4]).toContain('fui-rating-icon-empty fui-rating-icon-sm')
  })

  it('takes no colour: the brand fills both shapes with its rating token', async () => {
    expect((await marks({ color: 'primary' }))[0]).not.toContain('primary')
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    for (const part of ['rating-icon', 'rating-dot']) expect((trees[part]!.variants!.fill as Record<string, { textColor?: string }>).full!.textColor).toBe('{colors.rating}')
  })

  it('fills the mark the score reaches into by its fraction, from the start edge', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Rating, { rating: 4.6 }))
    const parts = [...host.querySelectorAll('[role="img"] > *')]
    expect(parts.map((el) => el.getAttribute('data-slot'))).toEqual([...Array(4).fill('rating-icon'), 'rating-partial'])
    const partial = parts[4]!
    expect(partial.getAttribute('aria-hidden')).toBe('true')
    expect(partial.querySelector('.fui-rating-icon-empty')).not.toBeNull()
    const clip = partial.querySelector<HTMLElement>('[data-slot="rating-partial-fill"]')!
    expect(clip.getAttribute('style')).toContain('width:60%')
    expect(clip.classList.contains('inset-s-0')).toBe(true)
    expect(clip.querySelector('.fui-rating-icon-full')).not.toBeNull()
  })

  it('draws whole marks only for a whole score, and keeps the score inside the scale', async () => {
    expect((await marks({ rating: 4 })).filter((m) => m.startsWith('rating-partial'))).toHaveLength(0)
    expect((await marks({ rating: 7 })).filter((m) => m.includes('-full '))).toHaveLength(5)
    expect((await marks({ rating: -1 })).filter((m) => m.includes('-empty '))).toHaveLength(5)
  })

  it('reads the exact score, not the marks rounded', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Rating, { rating: 4.62 }))
    expect(host.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('4.6 out of 5')
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolved } from '../../scripts/lib/look'

const root = join(import.meta.dirname, '../..')
// The classes CarouselItem puts on its element itself: its recipe and any fixed utility its template binds beside the caller's class.
const source = readFileSync(join(root, 'ui/carousel/CarouselItem.vue'), 'utf8')
const bound = source.match(/:class="\[([^\]]*)\]"/)![1]!
const item = ['fui-carousel-item', 'fui-carousel-item-horizontal', ...[...bound.matchAll(/'([^']+)'/g)].map(([, cls]) => cls!)]

const element = async (...extra: string[]) => (await resolved(root, [...item, ...extra])).get('E')

describe('a carousel item', { timeout: 30_000 }, () => {
  it('fills the viewport by default', async () => {
    expect((await element())?.get('flex-basis')).toBe('100%')
  })

  it.each([
    ['basis-1/3', 'calc(1 / 3 * 100%)'],
    ['basis-[65%]', '65%'],
  ])('takes the basis a caller gives it: %s', async (cls, basis) => {
    expect((await element(cls))?.get('flex-basis')).toBe(basis)
  })

  // flex-basis: auto falls back to the width, so the item must set none of its own for content-sized slides.
  it('sizes to its content under basis-auto', async () => {
    const own = await element('basis-auto')
    expect(own?.get('flex-basis')).toBe('auto')
    expect(own?.get('width')).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { constraints, snapshotDiff, snapshotText } from '../../scripts/lib/snapshot'

const grid = (axes: Record<string, string[]>) => Object.entries(axes).reduce<Record<string, string>[]>((all, [axis, values]) => all.flatMap((c) => values.map((v) => ({ ...c, [axis]: v }))), [{}])
const all = grid({ viewport: ['phone', 'desktop'], variant: ['solid', 'soft', 'ghost'], size: ['sm', 'md'] })

describe('the look snapshot', () => {
  it('writes no constraint for a line that holds everywhere', () => {
    expect(constraints(all, all)).toBe('')
  })
  it('names only the axes that narrow the set, the viewport bare', () => {
    expect(
      constraints(
        all.filter((c) => c.viewport === 'desktop' && c.variant !== 'ghost'),
        all,
      ),
    ).toBe('desktop variant=solid,soft')
  })
  it('splits a set no single constraint describes into several', () => {
    const holds = all.filter((c) => (c.viewport === 'phone' && c.size === 'sm') || (c.viewport === 'desktop' && c.variant === 'ghost'))
    expect(constraints(holds, all)).toBe('desktop variant=ghost; phone size=sm')
  })
  it('leaves out an axis the line does not depend on, even where it needs several constraints', () => {
    const holds = all.filter((c) => (c.variant === 'solid' && c.size === 'sm') || (c.variant === 'ghost' && c.size === 'md'))
    expect(constraints(holds, all)).toBe('size=md variant=ghost; size=sm variant=solid')
  })
  it('splits where the fewest constraints come out', () => {
    const holds = all.filter((c) => c.variant === 'solid' || (c.variant === 'soft' && c.size === 'sm'))
    expect(constraints(holds, all)).toBe('size=sm variant=soft; variant=solid')
  })
  it('reads back as exactly the set it was written from', () => {
    let seed = 7
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const matches = (c: Record<string, string>, part: string) =>
      part.split(' ').every((token) => (token.includes('=') ? token.split('=')[1]!.split(',').includes(c[token.split('=')[0]!]!) : token.split(',').includes(c.viewport!)))
    for (let n = 0; n < 300; n++) {
      const holds = all.filter(() => random() < 0.5)
      if (!holds.length) continue
      const written = constraints(holds, all)
      const read = written ? all.filter((c) => written.split('; ').some((part) => matches(c, part))) : all
      expect(read, written).toEqual(holds)
    }
  })
  it('sorts lines and suffixes each with its constraints', () => {
    const elements = new Map([
      [
        'button',
        {
          combos: all,
          lines: new Map([
            ['E | height: 36px', all],
            ['E:hover | opacity: 0.9', all.filter((c) => c.variant === 'solid')],
          ]),
        },
      ],
    ])
    expect(snapshotText(elements, [])).toBe('button | E | height: 36px\nbutton | E:hover | opacity: 0.9 [variant=solid]\n')
  })
  it('heads the file with the elements resolved from every literal', () => {
    expect(snapshotText(new Map(), ['menu (approximate)'])).toBe('# approximate: menu (approximate)\n')
  })
  it('diffs two snapshots by line', () => {
    expect(snapshotDiff('a\nb\n', 'b\nc\n')).toEqual({ removed: ['a'], added: ['c'] })
  })
})

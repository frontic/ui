import { describe, expect, it } from 'vitest'
import { axisCollisions } from '../src/recipe.mjs'

const tree = (variants, extra = {}) => ({ trees: { nav: { variants, ...extra } }, flat: {} })

describe('axisCollisions', () => {
  it('names two values of different axes that set one property differently, with no with pair between them', () => {
    const recipes = tree({ layout: { captioned: { textColor: '{colors.foreground/70}' }, beside: { height: '{spacing.9}' } }, tone: { highlight: { textColor: '{colors.destructive}' } } })
    expect(axisCollisions(recipes)).toEqual([{ recipe: 'nav', values: ['layout.captioned', 'tone.highlight'], property: 'textColor' }])
  })

  it('reads a state and a part as their own property, and a family a value extends as the value’s own', () => {
    const recipes = {
      trees: {
        nav: {
          variants: { layout: { captioned: { extends: 'muted', hover: { textColor: '{colors.a}' } } }, tone: { highlight: { backgroundColor: '{colors.b}', hover: { textColor: '{colors.c}' } } } },
        },
      },
      flat: { muted: { backgroundColor: '{colors.d}' } },
    }
    expect(axisCollisions(recipes).map((c) => c.property)).toEqual(['backgroundColor', 'hover.textColor'])
  })

  it('finds nothing where both values set the same value, a with pair sets the property, or the values share an axis', () => {
    const same = tree({ layout: { captioned: { textColor: '{colors.a}' } }, tone: { highlight: { textColor: '{colors.a}' } } })
    const paired = tree({ layout: { captioned: { textColor: '{colors.a}', with: { tone: { highlight: { textColor: '{colors.b}' } } } } }, tone: { highlight: { textColor: '{colors.c}' } } })
    const pairedFromTheOtherSide = tree({
      layout: { captioned: { textColor: '{colors.a}' } },
      tone: { highlight: { textColor: '{colors.c}', with: { layout: { captioned: { textColor: '{colors.b}' } } } } },
    })
    const oneAxis = tree({ tone: { highlight: { textColor: '{colors.a}' }, quiet: { textColor: '{colors.b}' } } })
    for (const recipes of [same, paired, pairedFromTheOtherSide, oneAxis]) expect(axisCollisions(recipes)).toEqual([])
  })

  it('still names a property the with pair between the values leaves unset', () => {
    const recipes = tree({
      layout: { captioned: { textColor: '{colors.a}', gap: '{spacing.1}', with: { tone: { highlight: { textColor: '{colors.b}' } } } } },
      tone: { highlight: { textColor: '{colors.c}', gap: '{spacing.2}' } },
    })
    expect(axisCollisions(recipes)).toEqual([{ recipe: 'nav', values: ['layout.captioned', 'tone.highlight'], property: 'gap' }])
  })

  it('leaves out the contrast markers, which render nothing', () => {
    const recipes = tree({ layout: { captioned: { ground: '{colors.a}', decorative: true } }, tone: { highlight: { ground: '{colors.b}', decorative: false } } })
    expect(axisCollisions(recipes)).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { CONTRAST_STANDARDS, CONTRAST_THRESHOLDS, contrastLine, recipeContrast, recipeContrastProblems } from '../src/contrast.mjs'

const srgb = (hex) => ({ $value: { colorSpace: 'srgb', components: [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), hex } })
const brand = (colours, text = {}) => ({
  color: { $type: 'color', surface: Object.fromEntries(Object.entries(colours).map(([name, hex]) => [name, srgb(hex)])) },
  text: Object.fromEntries(Object.entries(text).map(([name, [rem, weight]]) => [name, { $value: { fontSize: { value: rem, unit: 'rem' }, fontWeight: weight } }])),
})
const PAGE = { background: '#ffffff', card: '#ffffff', popover: '#ffffff' }
const run = (recipes, colours, text) => recipeContrast({ flat: {}, trees: {}, ...recipes }, brand({ ...PAGE, ...colours }, text))
const one = (pairs) => pairs.map(({ recipe, at, role, over, under, needs }) => ({ recipe, at, role, over, under, needs }))

describe('recipe contrast', () => {
  it('carries the colours it measured, a translucent background composited over its ground', () => {
    const pairs = run({ flat: { chip: { backgroundColor: '{colors.fill/50}', textColor: '{colors.ink}' } } }, { fill: '#000000', ink: '#ffffff' })
    expect(pairs.map(({ fg, bg }) => ({ fg, bg }))).toEqual([{ fg: 'rgb(255 255 255)', bg: 'rgb(128 128 128)' }])
  })

  it('measures text on its own background at 4.5, and reports it below', () => {
    const pairs = run({ flat: { chip: { backgroundColor: '{colors.fill}', textColor: '{colors.ink}' } } }, { fill: '#777777', ink: '#ffffff' })
    expect(one(pairs)).toEqual([{ recipe: 'chip', at: '', role: 'text', over: '{colors.ink}', under: '{colors.fill}', needs: 4.5 }])
    expect(pairs[0].ratio).toBe(4.48)
    expect(recipeContrastProblems({ flat: { chip: { backgroundColor: '{colors.fill}', textColor: '{colors.ink}' } }, trees: {} }, brand({ ...PAGE, fill: '#767676', ink: '#ffffff' }))).toEqual([])
  })
  it('measures text with no background on every page surface, surfaces of one colour once', () => {
    expect(one(run({ flat: { note: { textColor: '{colors.ink}' } } }, { ink: '#999999' })).map((p) => p.under)).toEqual(['page.background,card,popover'])
    expect(one(run({ flat: { note: { textColor: '{colors.ink}' } } }, { ink: '#999999', card: '#fafafa' })).map((p) => p.under)).toEqual(['page.background,popover', 'page.card'])
  })
  it('measures on the ground a recipe names, and only there', () => {
    expect(one(run({ flat: { legal: { textColor: '{colors.background}', ground: '{colors.foreground}' } } }, { foreground: '#09090b' })).map((p) => p.under)).toEqual(['{colors.foreground}'])
  })
  it('measures a part tree with no background on its tree’s background', () => {
    const trees = { card: { base: { backgroundColor: '{colors.panel}' } }, 'card-header': { base: { textColor: '{colors.ink}' } } }
    expect(one(run({ trees }, { panel: '#000000', ink: '#ffffff' })).filter((p) => p.recipe === 'card-header')).toEqual([
      { recipe: 'card-header', at: 'base', role: 'text', over: '{colors.ink}', under: '{colors.panel}', needs: 4.5 },
    ])
  })
  it('reads an icon from iconColor, fill or stroke, or a text colour that fills, strokes or backs the recipe; a border in the text colour leaves text', () => {
    const flat = {
      tick: { iconColor: '{colors.ink}' },
      star: { textColor: '{colors.ink}', fill: 'currentColor' },
      dot: { textColor: '{colors.ink}', backgroundColor: 'currentColor' },
      outline: { textColor: '{colors.ink}', borderColor: 'currentColor' },
      word: { textColor: '{colors.ink}' },
    }
    const roles = Object.fromEntries(run({ flat }, { ink: '#000000' }).map((p) => [p.recipe, [p.role, p.needs]]))
    expect(roles).toEqual({ tick: ['icon', 3], star: ['icon', 3], dot: ['icon', 3], outline: ['text', 4.5], word: ['text', 4.5] })
  })
  it('holds large text to 3: 24px, or 18.66px at bold', () => {
    const text = { heading: [1.5, 600], lead: [1.25, 400], small: [0.875, 700] }
    const flat = {
      h: { textColor: '{colors.ink}', typography: '{typography.heading}' },
      l: { textColor: '{colors.ink}', typography: '{typography.lead}', fontWeight: 'bold' },
      s: { textColor: '{colors.ink}', typography: '{typography.small}' },
    }
    const roles = Object.fromEntries(run({ flat }, { ink: '#000000' }, text).map((p) => [p.recipe, p.role]))
    expect(roles).toEqual({ h: 'large', l: 'large', s: 'text' })
  })
  it('holds the focus ring and a value’s ring colour to 3 on the page', () => {
    const pairs = run(
      { flat: { 'focus-ring': { outlineColor: '{colors.ring}' } }, trees: { button: { base: {}, variants: { color: { danger: { ringColor: '{colors.ring}' } } } } } },
      { ring: '#9f9fa9' },
    )
    expect(new Set(pairs.map((p) => `${p.recipe}:${p.role}:${p.needs}`))).toEqual(new Set(['focus-ring:ring:3', 'button:ring:3']))
  })
  it('reads a value’s background into its with block, and a state’s background under the block’s text', () => {
    const trees = {
      button: {
        base: { textColor: '{colors.ink}' },
        variants: { variant: { soft: { backgroundColor: '{colors.tint}', with: { color: { danger: { textColor: '{colors.red}' } } } } }, color: { danger: {} } },
      },
    }
    const pairs = one(run({ trees }, { ink: '#000000', tint: '#eeeeee', red: '#ff0000' }))
    expect(pairs).toContainEqual({ recipe: 'button', at: 'variants.variant.soft.with.color.danger', role: 'text', over: '{colors.red}', under: '{colors.tint}', needs: 4.5 })
    const hover = one(run({ flat: { item: { textColor: '{colors.ink}', hover: { backgroundColor: '{colors.tint}' } } } }, { ink: '#000000', tint: '#eeeeee' }))
    expect(hover).toContainEqual({ recipe: 'item', at: 'hover', role: 'text', over: '{colors.ink}', under: '{colors.tint}', needs: 4.5 })
  })
  it('reads into a with block what the other axis’s value sets, as the element wears both', () => {
    const trees = {
      button: {
        base: {},
        variants: { variant: { outline: { with: { color: { inverse: { textColor: '{colors.background}' } } } } }, color: { inverse: { ground: '{colors.foreground}' } } },
      },
    }
    const pairs = one(run({ trees }, { foreground: '#09090b' })).filter((p) => p.at === 'variants.variant.outline.with.color.inverse')
    expect(pairs).toEqual([{ recipe: 'button', at: 'variants.variant.outline.with.color.inverse', role: 'text', over: '{colors.background}', under: '{colors.foreground}', needs: 4.5 }])
  })
  it('reports a colour at the value that sets it, before any pair that also wears it', () => {
    const trees = { button: { base: {}, variants: { variant: { solid: { with: { color: { danger: {} } } } }, color: { danger: { ringColor: '{colors.ring}' } } } } }
    expect(one(run({ trees }, { ring: '#eeeeee' })).map((p) => p.at)).toEqual(['variants.color.danger'])
  })
  it('skips a decorative recipe or value and the disabled state recipe', () => {
    const trees = { empty: { base: {}, variants: { variant: { icon: { decorative: true, textColor: '{colors.ink}' } } } } }
    const flat = { disabled: { textColor: '{colors.ink}' }, art: { decorative: true, textColor: '{colors.ink}' } }
    expect(run({ flat, trees }, { ink: '#eeeeee' })).toEqual([])
  })
  it('composites the background over its ground, then the text over that', () => {
    const [pair] = run({ flat: { soft: { backgroundColor: '{colors.red/10}', textColor: '{colors.red}' } } }, { red: '#e7000b' })
    expect(pair.ratio).toBe(3.99)
    expect(pair.under).toBe('{colors.red/10} on page.background,card,popover')
  })
  it('reads a background from the family a value extends', () => {
    const flat = { surface: { backgroundColor: '{colors.panel}' } }
    const trees = { box: { base: { extends: 'surface', textColor: '{colors.ink}' } } }
    expect(one(run({ flat, trees }, { panel: '#000000', ink: '#ffffff' })).filter((p) => p.recipe === 'box')[0]?.under).toBe('{colors.panel}')
  })
  it('measures nothing and throws nothing without recipes, colours or a token', () => {
    expect(recipeContrast(undefined, undefined)).toEqual([])
    expect(recipeContrast({ flat: { x: { textColor: '{colors.ink}' } }, trees: {} }, {})).toEqual([])
    expect(run({ flat: { x: { textColor: '{colors.missing}' } } }, {})).toEqual([])
  })
  it('names a pair in one line', () => {
    expect(contrastLine({ recipe: 'button', at: 'variants.variant.soft', role: 'text', over: '{colors.red}', under: '{colors.red/10} on page.background', ratio: 3.99, needs: 4.5 })).toBe(
      'button.variants.variant.soft: text {colors.red} on {colors.red/10} on page.background is 3.99:1, needs 4.5:1',
    )
  })
  it('holds text to 7 and large text to 4.5 under AAA', () => {
    const tokens = brand({ ...PAGE, ink: '#767676', grey: '#8a8a8a' }, { heading: [1.5, 600] })
    const problems = (flat, standard) => one(recipeContrastProblems({ flat, trees: {} }, tokens, standard && { standard }))
    const text = { t: { textColor: '{colors.ink}' } }
    const large = { h: { textColor: '{colors.grey}', typography: '{typography.heading}' } }
    const icon = { i: { iconColor: '{colors.grey}' } }
    expect(problems(text)).toEqual([])
    expect(problems(text, 'AAA')).toMatchObject([{ recipe: 't', role: 'text', needs: 7 }])
    expect(problems(large)).toEqual([])
    expect(problems(large, 'AAA')).toMatchObject([{ recipe: 'h', role: 'large', needs: 4.5 }])
    expect(problems(icon)).toEqual([])
    expect(problems(icon, 'AAA')).toEqual([])
  })
  it('keeps AA as the default thresholds', () => {
    expect(CONTRAST_THRESHOLDS).toEqual(CONTRAST_STANDARDS.AA)
    expect(CONTRAST_STANDARDS.AAA).toEqual({ text: 7, large: 4.5, icon: 3, ring: 3 })
  })
  it('refuses a standard it does not know', () => {
    expect(() => recipeContrast({ flat: {}, trees: {} }, brand(PAGE), { standard: 'AAAA' })).toThrow('unknown contrast standard: AAAA')
  })
})

import { describe, expect, it } from 'vitest'
import { brandContrastProblems, recipeTokenProblems, renderBaseCss, withBrandStyles } from '../src/brand.mjs'
import { recipeContrast } from '../src/contrast.mjs'

const swatch = (hex) => ({ $value: { colorSpace: 'srgb', components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 1e4) / 1e4), hex } })
const brand = (color) => ({
  color: { $type: 'color', ...Object.fromEntries(Object.entries(color).map(([group, names]) => [group, Object.fromEntries(Object.entries(names).map(([name, hex]) => [name, swatch(hex)]))])) },
})
const hover = (tokens, group, name) => withBrandStyles(tokens).color[group][`${name}-hover`]?.$value.hex

describe('a hover colour the brand leaves out', () => {
  it('steps the base 0.06 in oklab lightness away from its foreground, or to the no-room floor and ceiling', () => {
    expect(hover(brand({ action: { primary: '#000000', 'primary-foreground': '#ffffff' } }), 'action', 'primary')).toBe('#2e2e2e')
    expect(hover(brand({ action: { primary: '#ffffff', 'primary-foreground': '#000000' } }), 'action', 'primary')).toBe('#e4e4e4')
    expect(hover(brand({ action: { primary: '#ff7100', 'primary-foreground': '#ffffff' } }), 'action', 'primary')).toBe('#e36400')
  })

  it('is a literal sRGB token, the shape every brand colour has', () => {
    const value = withBrandStyles(brand({ status: { destructive: '#e60000', 'destructive-foreground': '#ffffff' } })).color.status['destructive-hover'].$value
    expect(value).toEqual({ colorSpace: 'srgb', components: value.components, hex: '#c70000' })
    expect(value.components.map((c) => Math.round(c * 255))).toEqual([0xc7, 0, 0])
  })

  it('pairs the surface foreground with the background, and derives none for a surface nobody hovers', () => {
    const tokens = withBrandStyles(brand({ surface: { background: '#ffffff', foreground: '#000000', card: '#ffffff', 'card-foreground': '#000000' } }))
    expect(tokens.color.surface['foreground-hover'].$value.hex).toBe('#2e2e2e')
    expect(tokens.color.surface['background-hover']).toBeUndefined()
    expect(tokens.color.surface['card-hover']).toBeUndefined()
  })

  it('fills only the colours a component hovers: primary, destructive, buy and checkout, each with its own foreground', () => {
    const tokens = withBrandStyles(
      brand({
        action: { primary: '#000000', 'primary-foreground': '#ffffff', secondary: '#000000', 'secondary-foreground': '#ffffff' },
        status: { destructive: '#000000', 'destructive-foreground': '#ffffff', info: '#000000', 'info-foreground': '#ffffff' },
        commerce: { buy: '#000000', 'buy-foreground': '#ffffff', checkout: '#000000', 'checkout-foreground': '#ffffff', promo: '#000000', 'promo-foreground': '#ffffff' },
        accent: { muted: '#000000', 'muted-foreground': '#ffffff' },
        edge: { ring: '#000000', border: '#ffffff' },
      }),
    )
    const hovers = Object.entries(tokens.color).flatMap(([group, entries]) =>
      Object.keys(entries)
        .filter((name) => name.endsWith('-hover'))
        .map((name) => `${group}.${name}`),
    )
    expect(hovers.sort()).toEqual(['action.primary-hover', 'commerce.buy-hover', 'commerce.checkout-hover', 'status.destructive-hover'])
    for (const hover of hovers) expect(tokens.color[hover.split('.')[0]][hover.split('.')[1]].$value.hex, hover).toBe('#2e2e2e')
  })

  it('never touches a hover the brand sets, and derives none without a foreground to pair with', () => {
    const tokens = withBrandStyles(brand({ action: { primary: '#000000', 'primary-foreground': '#ffffff', 'primary-hover': '#123456', active: '#000000' } }))
    expect(tokens.color.action['primary-hover'].$value.hex).toBe('#123456')
    expect(tokens.color.action['active-hover']).toBeUndefined()
  })

  it('derives none for a translucent base or an alias of one', () => {
    const tokens = brand({ action: { primary: '#000000', 'primary-foreground': '#ffffff' } })
    tokens.color.action.primary.$value.alpha = 0.5
    tokens.color.action.secondary = { $value: '{color.action.primary}' }
    tokens.color.action['secondary-foreground'] = swatch('#ffffff')
    expect(Object.keys(withBrandStyles(tokens).color.action)).toEqual(['primary', 'primary-foreground', 'secondary', 'secondary-foreground'])
  })

  it('leaves the brand it is given as it was', () => {
    const tokens = brand({ action: { primary: '#000000', 'primary-foreground': '#ffffff' } })
    withBrandStyles(tokens)
    expect(Object.keys(tokens.color.action)).toEqual(['primary', 'primary-foreground'])
  })

  it('reports a failing base once: its derived hover is marked and the contrast lint leaves it to the base', () => {
    const tokens = withBrandStyles(brand({ action: { primary: '#888888', 'primary-foreground': '#999999' } }))
    expect(tokens.color.action['primary-hover'].$extensions).toEqual({ 'com.frontic.brand': { derived: true } })
    expect(brandContrastProblems(tokens).map((problem) => problem.pair)).toEqual(['action.primary / action.primary-foreground'])
  })

  it('derives none where the no-room step, which moves toward the foreground, would fail a pair the base passes', () => {
    // #000 under #757575 passes at 4.56:1; with no room to darken, the hover would lighten to #2e2e2e, about 2.95:1.
    const raw = brand({ action: { primary: '#000000', 'primary-foreground': '#757575' } })
    expect(withBrandStyles(raw).color.action['primary-hover']).toBeUndefined()
    expect(brandContrastProblems(raw)).toEqual([])
    expect(recipeTokenProblems({ flat: { press: { hover: { backgroundColor: '{colors.primary-hover}' } } } }, raw)).toEqual([
      { recipe: 'press', at: 'hover.backgroundColor', ref: '{colors.primary-hover}', underived: { against: 'primary-foreground', ratio: 2.95 } },
    ])
  })

  it('measures a derived hover whose base passes, and reads a brand passed as it is on disk in the brand lint and the recipe contrast', () => {
    const raw = brand({ action: { primary: '#ff7100', 'primary-foreground': '#ffffff' } })
    const marked = structuredClone(raw)
    marked.color.action['primary-hover'] = { ...swatch('#eeeeee'), $extensions: { 'com.frontic.brand': { derived: true } } }
    marked.color.action.primary = swatch('#000000')
    expect(brandContrastProblems(marked).map((problem) => problem.pair)).toEqual(['action.primary-hover / action.primary-foreground'])
    const recipes = { flat: { press: { backgroundColor: '{colors.primary}', textColor: '{colors.primary-foreground}', hover: { backgroundColor: '{colors.primary-hover}' } } } }
    expect(recipeContrast(recipes, raw).map((pair) => pair.under)).toContain('{colors.primary-hover}')
  })

  it('measures the derived hovers of a brand passed as it is on disk, at the level the lint is asked for', () => {
    // #000 under #aaaaaa passes AAA; its no-room hover #2e2e2e passes AA only, at 5.85:1.
    const raw = brand({ action: { primary: '#000000', 'primary-foreground': '#aaaaaa' } })
    expect(brandContrastProblems(raw, { text: 7 })).toEqual([{ pair: 'action.primary-hover / action.primary-foreground', ratio: 5.85, needs: 7 }])
  })

  it('still reports a hover the brand sets that fails on its own', () => {
    const tokens = withBrandStyles(brand({ action: { primary: '#000000', 'primary-foreground': '#ffffff', 'primary-hover': '#eeeeee' } }))
    expect(brandContrastProblems(tokens).map((problem) => problem.pair)).toEqual(['action.primary-hover / action.primary-foreground'])
  })

  it('keeps the derived mark out of the stylesheet', () => {
    const css = renderBaseCss(brand({ action: { primary: '#ff7100', 'primary-foreground': '#ffffff' } }))
    expect(css).not.toContain('derived')
  })

  it('reaches the build and the reference lint, which read the brand through withBrandStyles', () => {
    const tokens = brand({ action: { primary: '#ff7100', 'primary-foreground': '#ffffff' } })
    expect(renderBaseCss(tokens)).toContain('--fui-primary-hover: #e36400;')
    expect(recipeTokenProblems({ flat: { press: { hover: { backgroundColor: '{colors.primary-hover}' } } } }, tokens)).toEqual([])
  })

  it('matches 15 hovers another implementation of the same rule wrote', () => {
    // Each row: a base and its pair from an example brand, and the hover that implementation wrote for it.
    const rows = [
      ['surface', 'foreground', '#f2f2f0', 'background', '#0a0b0d', '#dededc'],
      ['action', 'primary', '#d8ff3c', 'primary-foreground', '#0a0b0d', '#c5eb0f'],
      ['status', 'destructive', '#9a5510', 'destructive-foreground', '#f2f2f0', '#844600'],
      ['commerce', 'buy', '#d8ff3c', 'buy-foreground', '#0a0b0d', '#c5eb0f'],
      ['commerce', 'checkout', '#d8ff3c', 'checkout-foreground', '#0a0b0d', '#c5eb0f'],
      ['surface', 'foreground', '#1e1e1e', 'background', '#ffffff', '#2e2e2e'],
      ['action', 'primary', '#ff7100', 'primary-foreground', '#ffffff', '#e36400'],
      ['status', 'destructive', '#e60000', 'destructive-foreground', '#ffffff', '#c70000'],
      ['commerce', 'buy', '#ff7100', 'buy-foreground', '#ffffff', '#e36400'],
      ['commerce', 'checkout', '#f7567c', 'checkout-foreground', '#1e1214', '#ff7993'],
      ['surface', 'foreground', '#000000', 'background', '#ffffff', '#2e2e2e'],
      ['action', 'primary', '#ef326c', 'primary-foreground', '#ffffff', '#d90f5b'],
      ['status', 'destructive', '#ff1b1b', 'destructive-foreground', '#ffffff', '#e3000c'],
      ['commerce', 'buy', '#ef326c', 'buy-foreground', '#ffffff', '#d90f5b'],
      ['commerce', 'checkout', '#f7567c', 'checkout-foreground', '#1e1214', '#ff7993'],
    ]
    expect(rows.map(([group, name, base, pair, pairHex]) => hover(brand({ [group]: { [name]: base, [pair]: pairHex } }), group, name))).toEqual(rows.map((row) => row[5]))
  })
})

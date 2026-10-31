import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { brandColourNameDuplicates, brandColourNameProblems, colourOwners, recipeTokenProblems, renderBaseCss, resolveBrand, stylePresetPath, stylePresets } from '../src/brand.mjs'
import { recipeContrast } from '../src/contrast.mjs'
const preset = (id = 'default') => JSON.parse(readFileSync(stylePresetPath(id), 'utf8'))

describe('a colour name two groups write', () => {
  it('is a problem naming both paths, since both declare one --fui-<name> and the second overrides the first', () => {
    const brand = preset()
    brand.color.tone = { primary: { $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } } }
    expect(brandColourNameProblems(brand)).toEqual(['color.action.primary, color.tone.primary: both declare --fui-primary; a colour name is unique across the colour groups'])
    expect(() => renderBaseCss(brand)).toThrow('color.action.primary, color.tone.primary: both declare --fui-primary')
  })

  it('counts a hover the brand writes against one the contract derives for the same name, and is no problem in resolveBrand', () => {
    const brand = preset()
    brand.color.tone = { 'primary-hover': { $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } } }
    delete brand.color.action['primary-hover']
    expect(brandColourNameProblems(brand)).toEqual([
      'color.action.primary-hover (derived), color.tone.primary-hover: both declare --fui-primary-hover; a colour name is unique across the colour groups',
    ])
    expect(resolveBrand(brand).problems).toEqual([])
  })

  it('comes structured from brandColourNameDuplicates, each path with whether the contract derived it, and the problems are those as text', () => {
    const brand = preset()
    brand.color.tone = { 'primary-hover': { $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } }, accent: { $value: '{color.action.primary}' } }
    brand.color.mood = { accent: { $value: '{color.action.primary}' } }
    delete brand.color.action['primary-hover']
    expect(brandColourNameDuplicates(brand)).toEqual([
      {
        name: 'primary-hover',
        at: [
          { path: 'color.action.primary-hover', derived: true },
          { path: 'color.tone.primary-hover', derived: false },
        ],
      },
      {
        name: 'accent',
        at: [
          { path: 'color.accent.accent', derived: false },
          { path: 'color.tone.accent', derived: false },
          { path: 'color.mood.accent', derived: false },
        ],
      },
    ])
    expect(brandColourNameProblems(brand)).toEqual([
      'color.action.primary-hover (derived), color.tone.primary-hover: both declare --fui-primary-hover; a colour name is unique across the colour groups',
      'color.accent.accent, color.tone.accent, color.mood.accent: each declares --fui-accent; a colour name is unique across the colour groups',
    ])
  })

  it('is none in the presets', () => {
    for (const { id } of stylePresets()) expect(brandColourNameProblems(preset(id)), id).toEqual([])
  })
})

describe('a colour name two groups write, as a draft reads it before the stylesheet refuses it', () => {
  const hex = (value) => ({ $value: { colorSpace: 'srgb', components: [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255), hex: value } })
  const draft = (color) => ({
    color: { $type: 'color', ...Object.fromEntries(Object.entries(color).map(([group, names]) => [group, Object.fromEntries(Object.entries(names).map(([name, value]) => [name, hex(value)]))])) },
  })

  it('is owned by the later group, as the stylesheet’s later declaration wins', () => {
    const owners = colourOwners(draft({ surface: { background: '#ffffff' }, action: { primary: '#000000' }, tone: { primary: '#ff0000' } }))
    expect(Object.fromEntries([...owners].map(([name, { group }]) => [name, group]))).toEqual({ background: 'surface', primary: 'tone' })
    expect(owners.get('primary').token.$value.hex).toBe('#ff0000')
  })

  it('is read from the later group by the recipe token check: a hover of a colour outside HOVERED has no derived value to miss', () => {
    // action.primary alone would derive no hover (its no-room step fails #757575); tone.primary, written later, owns --fui-primary.
    const recipes = { flat: { press: { hover: { backgroundColor: '{colors.primary-hover}' } } } }
    const first = draft({ action: { primary: '#000000', 'primary-foreground': '#757575' } })
    expect(recipeTokenProblems(recipes, first)[0].underived).toEqual({ against: 'primary-foreground', ratio: 2.95 })
    const later = draft({ action: { primary: '#000000', 'primary-foreground': '#757575' }, tone: { primary: '#ff0000' } })
    expect(recipeTokenProblems(recipes, later)).toEqual([{ recipe: 'press', at: 'hover.backgroundColor', ref: '{colors.primary-hover}' }])
  })

  it('is measured from the later group by the recipe contrast', () => {
    const recipes = { flat: { chip: { backgroundColor: '{colors.background}', textColor: '{colors.foreground}' } }, trees: {} }
    const ratio = (color) => recipeContrast(recipes, draft(color)).find((pair) => pair.recipe === 'chip')?.ratio
    expect(ratio({ surface: { background: '#ffffff', foreground: '#000000' } })).toBe(21)
    expect(ratio({ surface: { background: '#ffffff', foreground: '#000000' }, tone: { background: '#000000' } })).toBe(1)
  })
})

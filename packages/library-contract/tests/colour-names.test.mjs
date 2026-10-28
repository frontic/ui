import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { brandColourNameProblems, renderBaseCss, resolveBrand, stylePresetPath, stylePresets } from '../src/brand.mjs'
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

  it('is none in the presets', () => {
    for (const { id } of stylePresets()) expect(brandColourNameProblems(preset(id)), id).toEqual([])
  })
})

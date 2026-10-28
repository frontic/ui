import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { recipeTokenProblems, stylePresets } from '@frontic/library-contract/brand'
import { describe, expect, it } from 'vitest'
import { contrastGate, readRegistryRecipes } from '../../scripts/lib/recipes'

const root = join(import.meta.dirname, '../..')

describe('the contrast gate', () => {
  it('names a failing pair once for every shipped preset', () => {
    const problems = contrastGate({ flat: { ghost: { textColor: '{colors.background}' } }, trees: {} })
    expect(problems.map((p) => p.preset)).toEqual(stylePresets().map((p) => p.id))
    expect(problems[0]!.line).toBe('ghost: text {colors.background} on page.background,card,popover is 1:1, needs 4.5:1')
  })
  it('passes a recipe set whose colours meet their thresholds', () => {
    expect(contrastGate({ flat: { body: { textColor: '{colors.foreground}' } }, trees: {} })).toEqual([])
  })
  it('reads the registry’s recipe files', () => {
    expect(Array.isArray(contrastGate(readRegistryRecipes(root)))).toBe(true)
  })
})

describe('the recipe tokens', () => {
  it('RT-02 every shipped preset defines every token the registry recipes reference', () => {
    const recipes = readRegistryRecipes(root)
    for (const preset of stylePresets()) expect(recipeTokenProblems(recipes, JSON.parse(readFileSync(preset.path, 'utf8'))), preset.id).toEqual([])
  })
})

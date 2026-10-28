import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOVERED, stylePresetPath } from '@frontic/library-contract/brand'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

/** Every colour whose `-hover` a recipe names, as `<group>.<name>` in the default brand. */
function hoveredByRecipes(): string[] {
  const { flat, trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
  const text = JSON.stringify([flat, trees])
  const color = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')).color as Record<string, Record<string, unknown>>
  const names = new Set([...text.matchAll(/\{colors\.([a-z-]+)-hover(?:\/\d+)?\}/g)].map((match) => match[1]!))
  return [...names].map((name) => `${Object.keys(color).find((group) => Object.hasOwn(color[group]!, name)) ?? '?'}.${name}`).sort()
}

describe('the colours the contract derives a hover for', () => {
  it('are the colours a recipe hovers, no more and no fewer', () => {
    expect([...HOVERED].sort()).toEqual(hoveredByRecipes())
  })
})

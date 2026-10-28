import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const { flat, trees, paths } = readRegistryRecipes(join(import.meta.dirname, '../..'))

const isEmptyRecord = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value) && !Object.keys(value).length

describe('recipe trees', () => {
  it('leave out variants and defaults rather than hold them empty', () => {
    const empties = Object.entries({ ...flat, ...trees }).flatMap(([name, def]) =>
      (['variants', 'defaults'] as const).filter((key) => Object.hasOwn(def, key) && isEmptyRecord((def as Record<string, unknown>)[key])).map((key) => `${paths[name]}: ${name}.${key}`),
    )
    expect(empties).toEqual([])
  })
})

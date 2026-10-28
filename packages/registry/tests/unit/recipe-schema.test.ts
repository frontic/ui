import { join } from 'node:path'
import { recipeJsonSchema } from '@frontic/library-contract/recipe-schema'
import { Ajv } from 'ajv'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const validate = new Ajv({ strict: false, allErrors: true }).compile(recipeJsonSchema())
const { flat, trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))

describe('the recipe schema', () => {
  it('accepts every registry recipe in a file as add writes it, under its name beside $schema', () => {
    const refused = Object.entries({ ...flat, ...trees }).flatMap(([name, recipe]) =>
      validate({ $schema: 'https://registry.ui.frontic.com/recipe.schema.json', [name]: recipe }) ? [] : [`${name}: ${JSON.stringify(validate.errors?.slice(0, 2))}`],
    )
    expect(Object.keys({ ...flat, ...trees })).toHaveLength(538)
    expect(refused).toEqual([])
  })

  it.each([
    ['a base that is no block', { base: 1 }],
    ['a layout keyword it does not know', { display: 'flexx' }],
    ['a state that is no block', { hover: 'x' }],
    ['a key no tree holds', { base: {}, compounds: [] }],
    ['a refused property', { fontSize: '{typography.ui}' }],
  ])('refuses %s', (_label, recipe) => {
    expect(validate({ chip: recipe })).toBe(false)
  })

  it('refuses a file in the one-recipe shape and a key that is no recipe name', () => {
    expect(validate({ base: {}, variants: {} })).toBe(false)
    expect(validate({ Chip: { base: {} } })).toBe(false)
  })
})

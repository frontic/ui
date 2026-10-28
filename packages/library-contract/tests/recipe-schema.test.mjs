import { describe, expect, it } from 'vitest'
import { ARRANGE_VALUES, LAYOUT_STEPS, RECIPE_PARTS, RECIPE_SCHEMA_URL, RECIPE_STATES, TREE_KEYS } from '../src/recipe.mjs'
import { recipeJsonSchema } from '../src/recipe-schema.mjs'

describe('recipeJsonSchema', () => {
  const schema = recipeJsonSchema()
  const block = schema.definitions.block

  it('is the schema recipe files name in $schema', () => {
    expect(schema.$id).toBe(RECIPE_SCHEMA_URL)
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
  })

  it('names every state, part and container step a recipe may nest, from the contract’s own lists', () => {
    for (const name of [...Object.keys(RECIPE_STATES), ...Object.keys(RECIPE_PARTS), ...LAYOUT_STEPS]) expect(block.properties[name], name).toEqual({ $ref: '#/definitions/block' })
  })

  it('lists each layout keyword’s values, as text and as the number a file may write', () => {
    expect(block.properties.display.enum).toEqual(Object.keys(ARRANGE_VALUES.display))
    expect(block.properties.gridColumns.enum).toEqual(expect.arrayContaining(['3', 3]))
  })

  it('holds a tree’s keys apart from a flat recipe’s', () => {
    expect(Object.keys(schema.definitions.tree.properties)).toEqual([...TREE_KEYS, 'composes'])
    expect(schema.definitions.tree.additionalProperties).toBe(false)
  })

  it('holds recipes by name, each a tree or a flat recipe, beside $schema', () => {
    expect(schema.propertyNames).toEqual({ anyOf: [{ const: '$schema' }, { pattern: '^[a-z][a-z0-9-]*$' }], not: { enum: [...TREE_KEYS, 'composes', 'with', 'extends', 'parts'] } })
    expect(schema.additionalProperties).toEqual({ $ref: '#/definitions/recipe' })
    expect(schema.definitions.recipe.then).toEqual({ $ref: '#/definitions/tree' })
  })

  it('is plain JSON: nothing in it is lost when it is written to a file', () => {
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema)
  })
})

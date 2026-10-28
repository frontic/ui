import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARRANGE_VALUES, readRecipeFiles, recipeFileOf, recipeFileText, RECIPE_SCHEMA_URL } from '../src/recipe.mjs'

const file = (path, value) => ({ path, text: typeof value === 'string' ? value : JSON.stringify(value) })

describe('readRecipeFiles', () => {
  it('reads each file as recipes by name, splits trees from flat recipes and drops $schema', () => {
    const read = readRecipeFiles([
      file('recipes/card.json', { $schema: 'x', card: { base: { color: '{colors.primary}' } }, 'card-header': { base: {} } }),
      file('recipes/shared/action.json', { action: { rounded: '{rounded.md}' } }),
    ])
    expect(read.trees).toEqual({ card: { base: { color: '{colors.primary}' } }, 'card-header': { base: {} } })
    expect(read.flat).toEqual({ action: { rounded: '{rounded.md}' } })
    expect(read.paths).toEqual({ card: 'recipes/card.json', 'card-header': 'recipes/card.json', action: 'recipes/shared/action.json' })
    expect(read.problems).toEqual([])
  })

  it('takes names from the keys, never from the file', () => {
    const read = readRecipeFiles([file('recipes/drawer.json', { 'drawer-content': { base: {} }, 'drawer-body': { base: {} } })])
    expect(Object.keys(read.trees)).toEqual(['drawer-content', 'drawer-body'])
  })

  it('refuses a name two files define, naming both, and keeps the first by path', () => {
    const read = readRecipeFiles([file('recipes/shared/link.json', { link: { color: '{colors.primary}' } }), file('recipes/link.json', { link: { base: {} } })])
    expect(read.problems).toEqual(['recipes/shared/link.json: link: defined in recipes/link.json too'])
    expect(read.trees).toEqual({ link: { base: {} } })
    expect(read.flat).toEqual({})
    expect(read.paths).toEqual({ link: 'recipes/link.json' })
  })

  it('refuses one bad key and keeps its siblings', () => {
    const read = readRecipeFiles([file('recipes/card.json', { card: { base: {} }, 'card-title': 'x', Bad: {} })])
    expect(read.problems).toEqual(['recipes/card.json: card-title: holds a recipe, a JSON object', 'recipes/card.json: Bad: is not a recipe name: lowercase letters, digits and dashes'])
    expect(read.trees).toEqual({ card: { base: {} } })
  })

  it.each([
    ['a tree', 'recipes/button.json', { base: {}, variants: {} }, 'button'],
    ['a flat recipe', 'recipes/shared/action.json', { rounded: '{rounded.md}', cursor: 'pointer' }, 'action'],
    ['a flat recipe holding only blocks', 'recipes/shared/link-primary.json', { link: { textColor: '{colors.primary}' } }, 'link-primary'],
  ])('refuses %s in the one-recipe shape as a whole file, saying the shape to write', (_, path, recipe, name) => {
    const read = readRecipeFiles([file(path, recipe)])
    expect(read.problems).toEqual([`${path}: holds one recipe, the 0.9 shape; a recipe file holds recipes by name: { "${name}": { … } }`])
    expect(read.paths).toEqual({})
  })

  it('reads a file whose one recipe is named like a block when the file is named after it', () => {
    expect(readRecipeFiles([file('recipes/shared/link.json', { link: { textColor: '{colors.primary}' } })]).flat).toEqual({ link: { textColor: '{colors.primary}' } })
  })

  it('names a file that is not JSON', () => {
    const read = readRecipeFiles([file('recipes/a.json', '{')])
    expect(read.problems).toHaveLength(1)
    expect(read.problems[0]).toMatch(/^recipes\/a\.json: not JSON: /)
    expect(read.flat).toEqual({})
  })

  it.each(['[]', '"x"', 'null', '3'])('names a file whose JSON is %s, not an object', (text) => {
    const read = readRecipeFiles([file('recipes/a.json', text)])
    expect(read.problems).toEqual(['recipes/a.json: holds recipes by name, a JSON object'])
    expect(read.paths).toEqual({})
  })
})

describe('recipeFileOf', () => {
  const paths = { button: 'recipes/button.json', action: 'recipes/shared/action.json' }
  it('finds the file a problem line is about by the recipe name it leads with', () => {
    expect(recipeFileOf('button.variants.size.sm.color: not a token', paths)).toBe('recipes/button.json')
    expect(recipeFileOf('button: makes fui-x, which y makes too', paths)).toBe('recipes/button.json')
    expect(recipeFileOf('fui-action: writes --fui-action-x, which fui-y writes too; rename one', paths)).toBe('recipes/shared/action.json')
    expect(recipeFileOf('recipe button: neither a flat recipe nor a component tree', paths)).toBe('recipes/button.json')
  })
  it('finds none for a recipe no file defines', () => {
    expect(recipeFileOf('nothing.color: x', paths)).toBeUndefined()
  })
})

describe('recipeFileText', () => {
  it('writes recipes by name under their $schema, in the order given, two-space indented, with a final newline', () => {
    expect(RECIPE_SCHEMA_URL).toBe('https://registry.ui.frontic.com/recipe.schema.json')
    expect(recipeFileText({ card: { base: {} }, 'card-header': {} })).toBe(
      '{\n  "$schema": "https://registry.ui.frontic.com/recipe.schema.json",\n  "card": {\n    "base": {}\n  },\n  "card-header": {}\n}\n',
    )
  })
})

describe('recipe.mjs', () => {
  it('imports nothing, so the stack’s client can read recipe files', () => {
    const source = readFileSync(path.join(import.meta.dirname, '../src/recipe.mjs'), 'utf8')
    expect(source.match(/^import /gm)).toBeNull()
  })
  it('exports the layout keywords, so a schema can list their values', () => {
    expect(Object.keys(ARRANGE_VALUES.display)).toContain('grid')
  })
})

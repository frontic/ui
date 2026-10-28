import { describe, expect, it } from 'vitest'
import { ITEM_MANIFEST_KEYS, ITEM_SCHEMA_URL, itemManifestText, manifestNameProblems, manifestOrderProblems } from '../src/recipe.mjs'

describe('an item manifest', () => {
  it('names the item schema the registry serves', () => {
    expect(ITEM_SCHEMA_URL).toBe('https://registry.ui.frontic.com/item.schema.json')
    expect(ITEM_MANIFEST_KEYS).toEqual(['$schema', 'name', 'title', 'description', 'categories', 'recipes', 'composes'])
  })

  it('is written $schema first, its keys in order, the rest after, two-space JSON with a final newline', () => {
    const text = itemManifestText({ composes: ['focus-ring'], mine: 1, recipes: { card: { base: {} } }, description: 'd', title: 'Card', $schema: 'elsewhere' })
    expect(text).toBe(`${JSON.stringify({ $schema: ITEM_SCHEMA_URL, title: 'Card', description: 'd', recipes: { card: { base: {} } }, composes: ['focus-ring'], mine: 1 }, null, 2)}\n`)
  })

  it('reports keys out of order, and none in order or for keys it does not order', () => {
    expect(manifestOrderProblems({ $schema: '', title: '', description: '', categories: [], recipes: {}, composes: [] })).toEqual([])
    expect(manifestOrderProblems({ title: '', mine: 1, recipes: {} })).toEqual([])
    expect(manifestOrderProblems({ $schema: '', title: '', composes: [], recipes: {} })).toEqual([
      'keys run $schema, title, composes, recipes; a manifest orders them $schema, title, recipes, composes',
    ])
  })

  it('holds a name only when it is the item’s folder name', () => {
    expect(manifestNameProblems({ title: 'Card' }, 'card')).toEqual([])
    expect(manifestNameProblems({ name: 'card' }, 'card')).toEqual([])
    expect(manifestNameProblems({ name: 'badge' }, 'card')).toEqual(['name: "badge" is not the item\'s folder name, card'])
  })
})

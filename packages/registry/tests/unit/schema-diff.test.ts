import { describe, expect, it } from 'vitest'
import { schemaDiff, schemaDiffMarkdown } from '../../scripts/lib/schema-diff'

const before = {
  properties: {
    type: { enum: ['registry:ui', 'registry:block'], description: 'The item type.' },
    css: { type: 'object' },
    docs: { type: 'string' },
    'a/b': { type: 'string' },
  },
}
const after = {
  properties: {
    type: { enum: ['registry:ui', 'registry:block', 'registry:font'], description: 'The type of the item.' },
    css: { $ref: '#/definitions/cssValue' },
    'a/b': { type: 'string' },
    font: { type: 'object' },
  },
  definitions: { cssValue: { type: 'object' } },
}

describe('the diff between two schemas', () => {
  it('names each added, removed and changed leaf by its JSON pointer, and reworded descriptions apart', () => {
    expect(schemaDiff(before, after)).toEqual({
      added: [
        { path: '/definitions/cssValue/type', value: '"object"' },
        { path: '/properties/css/$ref', value: '"#/definitions/cssValue"' },
        { path: '/properties/font/type', value: '"object"' },
      ],
      removed: [
        { path: '/properties/css/type', value: '"object"' },
        { path: '/properties/docs/type', value: '"string"' },
      ],
      changed: [{ path: '/properties/type/enum', before: '["registry:ui","registry:block"]', after: '["registry:ui","registry:block","registry:font"]' }],
      described: ['/properties/type/description'],
    })
  })

  it('records an empty object as a leaf, so a field that empties or appears empty shows', () => {
    expect(schemaDiff({ properties: { docs: { type: 'string' } } }, { properties: { docs: {}, meta: {} } })).toEqual({
      added: [
        { path: '/properties/docs', value: '{}' },
        { path: '/properties/meta', value: '{}' },
      ],
      removed: [{ path: '/properties/docs/type', value: '"string"' }],
      changed: [],
      described: [],
    })
  })

  it('names a change inside an array of objects by its index, and keeps an array of scalars as one leaf', () => {
    const rule = (type: string) => ({ if: { properties: { type: { const: type } } }, then: { required: ['name', 'type'] } })
    const diff = schemaDiff({ allOf: [rule('registry:font'), rule('registry:base')], required: ['name'] }, { allOf: [rule('registry:font'), rule('registry:theme')], required: ['name', 'type'] })
    expect(diff.changed).toEqual([
      { path: '/allOf/1/if/properties/type/const', before: '"registry:base"', after: '"registry:theme"' },
      { path: '/required', before: '["name"]', after: '["name","type"]' },
    ])
  })

  it('finds nothing between a schema and itself', () => {
    expect(schemaDiffMarkdown(schemaDiff(after, after))).toBe('No field changes.')
  })

  it('writes a table for the pull request, removals first, with the pipe in a value escaped', () => {
    const markdown = schemaDiffMarkdown(schemaDiff({ a: 'x|y', b: 1 }, { b: 2, c: true }))
    expect(markdown.split('\n')).toEqual(['| | Path | Before | After |', '|---|---|---|---|', '| removed | `/a` | `"x\\|y"` | |', '| changed | `/b` | `1` | `2` |', '| added | `/c` | | `true` |'])
  })
})

// The JSON Schema a project's recipe file names in `$schema`, built from the contract's own lists so the two cannot drift.

import {
  CONTRAST_PROPERTIES,
  EXTENDS,
  HIDE_PROPERTIES,
  LAYOUT_PARTS,
  LAYOUT_STEPS,
  PARTS,
  PROPERTY_GROUP,
  RECIPE_BLOCKS,
  RECIPE_NAME,
  RECIPE_PROPERTY,
  RECIPE_SCHEMA_URL,
  REFUSED_PROPERTIES,
  RING_PROPERTIES,
  TREE_COMPOSES,
  TREE_KEYS,
  VALUE_SETS,
  WITH,
} from './recipe.mjs'

const BLOCK = { $ref: '#/definitions/block' }
const VALUE = { type: ['string', 'number'] }
const FAMILIES = { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], description: 'The family, or families, this value extends: shared recipes, by name.' }
/** A keyword set as a file may write it: each value as text, and a number where the value is one. */
const keywords = (values) => values.flatMap((value) => (/^\d+$/.test(value) ? [value, Number(value)] : [value]))

/** What a recipe block may hold: properties, the states, parts and container steps it nests, and in a tree's value `extends`, `with` and `parts`.
 * `extra` names keys only the file's top level holds. */
function blockSchema(extra = {}) {
  const properties = {}
  for (const [prop, group] of Object.entries(PROPERTY_GROUP)) properties[prop] = { ...VALUE, description: `Takes {${group}.<name>}.` }
  for (const [prop, set] of Object.entries(VALUE_SETS)) properties[prop] = { enum: keywords(Object.keys(set)) }
  for (const [prop, hide] of Object.entries(HIDE_PROPERTIES)) properties[prop] = { enum: [...hide.values] }
  for (const prop of Object.keys(RING_PROPERTIES)) properties[prop] = { ...VALUE, description: 'Colours the shared focus ring for this element: {colors.<name>}.' }
  properties[CONTRAST_PROPERTIES.decorative] = { const: true, description: 'Marks the recipe’s colours as decoration, which the contrast check skips.' }
  properties[CONTRAST_PROPERTIES.ground] = { type: 'string', description: 'The colour this recipe sits on, for the contrast check: {colors.<name>}.' }
  for (const [prop, reason] of Object.entries(REFUSED_PROPERTIES)) properties[prop] = { not: {}, description: `Refused: ${reason}.` }
  for (const name of [...Object.keys(RECIPE_BLOCKS), ...LAYOUT_STEPS]) properties[name] = BLOCK
  properties[EXTENDS] = FAMILIES
  properties[WITH] = {
    type: 'object',
    description: 'Another axis, each value the block this value takes beside it.',
    additionalProperties: { type: 'object', additionalProperties: { $ref: '#/definitions/value' } },
  }
  properties[PARTS] = { type: 'object', description: 'The layout of this tree’s parts, each part a block.', additionalProperties: BLOCK }
  const nested = [...Object.keys(RECIPE_BLOCKS), ...Object.keys(LAYOUT_PARTS), ...LAYOUT_STEPS, EXTENDS, WITH, PARTS]
  return {
    type: 'object',
    properties: { ...extra, ...properties },
    propertyNames: { anyOf: [{ enum: [...new Set([...Object.keys(extra), ...nested])] }, { pattern: RECIPE_PROPERTY.source }] },
    additionalProperties: { anyOf: [VALUE, BLOCK] },
  }
}

/** The JSON Schema of a recipe file: recipes by name, each a component tree (`base`, `variants`, `defaults`, `keepAxis`) or a flat recipe. */
export function recipeJsonSchema() {
  const tree = {
    type: 'object',
    properties: {
      base: { $ref: '#/definitions/value' },
      variants: {
        type: 'object',
        description: 'Each axis, each of its values the block that value makes.',
        propertyNames: { pattern: RECIPE_NAME.source },
        additionalProperties: { type: 'object', propertyNames: { pattern: RECIPE_NAME.source }, additionalProperties: { $ref: '#/definitions/value' } },
      },
      defaults: { type: 'object', description: 'The value each axis takes when none is given.', additionalProperties: { type: 'string' } },
      keepAxis: { type: 'array', description: 'Values whose class keeps its axis name.', items: { type: 'string' } },
      [TREE_COMPOSES]: {
        type: 'array',
        description: 'The shared recipes this tree’s element wears, each a flat recipe; renders nothing. A tree may hold only this.',
        items: { type: 'string', pattern: RECIPE_NAME.source },
        minItems: 1,
        uniqueItems: true,
      },
    },
    additionalProperties: false,
  }
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: RECIPE_SCHEMA_URL,
    title: 'Frontic UI recipe file',
    description: 'Recipes of a Frontic UI library by name: a component and its parts, or one shared recipe. Each is a component tree or a flat recipe.',
    type: 'object',
    properties: { $schema: { type: 'string' } },
    propertyNames: { anyOf: [{ const: '$schema' }, { pattern: RECIPE_NAME.source }], not: { enum: [...TREE_KEYS, TREE_COMPOSES, WITH, EXTENDS, PARTS] } },
    additionalProperties: { $ref: '#/definitions/recipe' },
    definitions: {
      block: blockSchema(),
      value: { anyOf: [{ $ref: '#/definitions/block' }, FAMILIES] },
      tree,
      flat: blockSchema(),
      recipe: {
        if: { anyOf: [...TREE_KEYS, TREE_COMPOSES].map((key) => ({ required: [key] })) },
        then: { $ref: '#/definitions/tree' },
        else: { $ref: '#/definitions/flat' },
      },
    },
  }
}

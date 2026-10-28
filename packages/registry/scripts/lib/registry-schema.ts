import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Where the registry serves the schema a library's registry.json names in `$schema`. */
export const REGISTRY_SCHEMA_URL = 'https://registry.ui.frontic.com/registry.schema.json'

type Schema = Record<string, any>

/** shadcn's registry item, as the registry serves it at /schema/registry-item.json. */
const shadcnItem = (): Schema => JSON.parse(readFileSync(join(import.meta.dirname, '../../public/schema/registry-item.json'), 'utf8'))

/** A library's registry.json: shadcn's registry, its items in shadcn's item shape and as open as shadcn's, plus the types a Frontic
 * library holds (`registry:composable`, among the files `registry:example` too) and `meta.frontic`. An item carries no `composes`: its
 * recipes compose in its manifest. A file's `target` is optional for every type. shadcn's `definitions` move to the root, where its
 * `#/definitions/…` references resolve once the item sits under `items`. */
export function registryJsonSchema(): Schema {
  const { $schema: _draft, definitions, ...item } = shadcnItem()
  item.properties.type.enum = [...item.properties.type.enum, 'registry:composable']
  const file = item.properties.files.items
  const fileTypes: string[] = [...file.properties.type.enum, 'registry:composable', 'registry:example']
  const { if: _if, then: _then, else: _else, ...fileRules } = file
  item.properties.files.items = { ...fileRules, required: ['path', 'type'] }
  item.properties.files.items.properties.type.enum = fileTypes
  item.properties.meta = {
    ...item.properties.meta,
    properties: { frontic: { type: 'object', description: "Frontic's data on the item, such as its props, examples, placements and the source it was added from." } },
  }
  item.properties.composes = { not: {}, description: 'An item lists no composes here: each recipe tree lists its own, in the manifest beside the component.' }
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: REGISTRY_SCHEMA_URL,
    title: 'Frontic library registry',
    description: "A library's registry.json: its items in shadcn's registry shape.",
    type: 'object',
    definitions,
    properties: {
      $schema: { type: 'string', description: 'The JSON Schema an editor checks this file against.' },
      name: { type: 'string', description: "The library's name." },
      homepage: { type: 'string', description: "The library's homepage, or empty." },
      items: { type: 'array', items: item },
    },
    required: ['name', 'items'],
  }
}

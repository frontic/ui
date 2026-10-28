import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Ajv } from 'ajv'
import { describe, expect, it } from 'vitest'
import { REGISTRY_SCHEMA_URL, registryJsonSchema } from '../../scripts/lib/registry-schema'

const validate = new Ajv({ strict: false, allErrors: true }).compile(registryJsonSchema())
const fixture = (name: string) => JSON.parse(readFileSync(join(import.meta.dirname, '../fixtures/registry-schema', `${name}.registry.json`), 'utf8'))

/** A library's registry.json naming the schema, around `items`. */
const library = (items: unknown[]) => ({ $schema: REGISTRY_SCHEMA_URL, name: 'library', homepage: '', items })

describe('the registry schema', () => {
  it('names the URL it is served at', () => {
    expect(REGISTRY_SCHEMA_URL).toBe('https://registry.ui.frontic.com/registry.schema.json')
    expect(registryJsonSchema().$id).toBe(REGISTRY_SCHEMA_URL)
  })

  it.each(['basecamp', 'one-button'])('accepts the %s library as the stack writes it once composes has left registry.json', (name) => {
    expect(validate(fixture(name)), JSON.stringify(validate.errors?.slice(0, 3))).toBe(true)
  })

  it('accepts every item type a stored library holds, examples among the files, and whatever meta.frontic carries', () => {
    const files = (type: string) => [{ path: `components/x/${type}.vue`, type }]
    const items = [
      {
        name: 'chip',
        type: 'registry:ui',
        files: [...files('registry:ui'), ...files('registry:example')],
        meta: { frontic: { props: [{ name: 'size', kind: 'prop', type: 'string', required: false, from: 'Chip' }] } },
      },
      { name: 'promo', type: 'registry:block', files: files('registry:block'), meta: { frontic: { source: { kind: 'listing', name: 'ProductList' }, examples: [], placements: [] } } },
      { name: 'tile', type: 'registry:component', files: files('registry:component'), registryDependencies: ['chip'], dependencies: ['reka-ui'], devDependencies: ['vitest'] },
      { name: 'home', type: 'registry:page', title: 'Home', description: 'd', files: files('registry:page') },
      { name: 'format', type: 'registry:lib', files: [{ path: 'lib/format.ts', type: 'registry:lib' }] },
      { name: 'use-cart', type: 'registry:composable', files: [{ path: 'composables/use-cart.ts', type: 'registry:composable' }] },
    ]
    expect(validate(library(items)), JSON.stringify(validate.errors?.slice(0, 3))).toBe(true)
  })

  it('refuses an item that still carries composes, at the item’s composes', () => {
    const item = { ...fixture('one-button').items[0], composes: ['focus-ring'] }
    expect(validate(library([item]))).toBe(false)
    expect(validate.errors!.map((error) => error.instancePath)).toContain('/items/0/composes')
  })

  it('stays as open as shadcn’s: keys shadcn adds to an item, a file or the top level pass', () => {
    const [button] = fixture('one-button').items
    const item = { ...button, envVars: { API_URL: 'https://example.com' }, font: { family: 'Inter' }, files: [{ ...button.files[0], cache: true }] }
    expect(validate({ ...library([item]), include: ['blocks/registry.json'], pagination: {} }), JSON.stringify(validate.errors?.slice(0, 3))).toBe(true)
  })

  it('refuses an unknown item or file type and a missing name', () => {
    const [button] = fixture('one-button').items
    expect(validate(library([{ ...button, type: 'registry:widget' }]))).toBe(false)
    expect(validate(library([{ ...button, files: [{ path: 'a.vue', type: 'registry:widget' }] }]))).toBe(false)
    expect(validate({ $schema: REGISTRY_SCHEMA_URL, homepage: '' })).toBe(false)
  })
})

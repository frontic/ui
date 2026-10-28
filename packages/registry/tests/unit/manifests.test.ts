import Ajv from 'ajv'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MANIFEST_KEYS, manifestPath, readManifests } from '../../scripts/lib/manifests'

function root(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'manifests-'))
  for (const [path, value] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  return dir
}

describe('readManifests', () => {
  it('reads each item’s manifest as its authored entry, named by its folder, with its recipes as a recipe file', () => {
    const dir = root({
      'ui/card/Card.vue': '',
      'ui/card/card.json': { $schema: '../../item.schema.json', title: 'Card', description: 'd', categories: ['c'], recipes: { card: { composes: ['focus-ring'], base: {} } } },
      'lib/format.ts': '',
      'lib/format.json': { description: 'f' },
    })
    const { entries, paths, recipes } = readManifests(dir)
    expect(entries).toEqual([
      { name: 'card', title: 'Card', description: 'd', categories: ['c'], recipes: { card: { composes: ['focus-ring'], base: {} } } },
      { name: 'format', description: 'f' },
    ])
    expect(paths).toEqual({ card: 'ui/card/card.json', format: 'lib/format.json' })
    expect(recipes).toEqual([{ path: 'ui/card/card.json', text: JSON.stringify({ card: { composes: ['focus-ring'], base: {} } }) }])
  })

  it('reads an item without a manifest as no entry, so the build can name it', () => {
    expect(readManifests(root({ 'ui/card/Card.vue': '' })).entries).toEqual([])
  })

  it('names every problem at once: a key no manifest has, a name key, meta, recipes or composes on a lib item, a manifest for no item, and bad JSON', () => {
    const dir = root({
      'ui/card/card.json': { files: [] },
      'ui/chip/chip.json': { name: 'chips' },
      'ui/tag/tag.json': { title: 'Tag', meta: { frontic: { recipes: { default: 'tag' } } } },
      'ui/bad/bad.json': '{',
      'lib/format.ts': '',
      'lib/format.json': { recipes: {}, composes: ['disabled'] },
      'lib/orphan.json': {},
    })
    expect(() => readManifests(dir)).toThrow(
      [
        'manifests:',
        'ui/bad/bad.json: not JSON',
        `ui/card/card.json: files is not a manifest key: ${MANIFEST_KEYS.join(', ')}`,
        'ui/chip/chip.json: name: "chips" is not the item\'s folder name, chip',
        `ui/tag/tag.json: meta is not a manifest key: ${MANIFEST_KEYS.join(', ')}`,
        "ui/tag/tag.json: meta is gone: the item's own trees go in recipes, each shared recipe it puts on an element in the composes of that element's tree",
        'lib/format.json: composes: move it into the trees that wear it, "<tree>": { "composes": [ … ] }; the served item derives the list from them',
        'lib/format.json: recipes: a lib or composable item has no recipe',
        'lib/orphan.json: a manifest for no item; lib/<name>.json sits beside lib/<name>.ts',
      ].join('\n'),
    )
  })

  it('refuses a top-level composes, pointing at the trees that wear it', () => {
    const dir = root({ 'ui/card/card.json': { recipes: { card: { base: {} } }, composes: ['focus-ring'] } })
    expect(() => readManifests(dir)).toThrow(
      ['manifests:', 'ui/card/card.json: composes: move it into the trees that wear it, "<tree>": { "composes": [ … ] }; the served item derives the list from them'].join('\n'),
    )
  })

  it('refuses keys out of order, naming the order', () => {
    const dir = root({ 'ui/card/card.json': { title: 'Card', composes: ['focus-ring'], recipes: { card: { base: {} } } } })
    expect(() => readManifests(dir)).toThrow('ui/card/card.json: keys run title, composes, recipes; a manifest orders them title, recipes, composes')
  })

  it('takes a tree’s composes on its own, with no top-level list to be a subset of', () => {
    const dir = root({ 'ui/card/card.json': { recipes: { card: { composes: ['disabled'], base: {} } } } })
    expect(readManifests(dir).entries).toEqual([{ name: 'card', recipes: { card: { composes: ['disabled'], base: {} } } }])
  })

  it('refuses a tree whose keys run out of order, composes first', () => {
    const dir = root({ 'ui/card/card.json': { recipes: { card: { base: {}, composes: ['disabled'] } } } })
    expect(() => readManifests(dir)).toThrow('ui/card/card.json: recipes: card: keys run base, composes; a tree orders them composes, base')
  })

  it('refuses a tree a longer item name owns, or one named for no part of the item', () => {
    const dir = root({
      'ui/button/button.json': { recipes: { button: { base: {} }, 'button-group-x': { base: {} }, chip: { base: {} } } },
      'ui/button-group/button-group.json': { recipes: { 'button-group': { base: {} } } },
    })
    expect(() => readManifests(dir)).toThrow(
      [
        'manifests:',
        'ui/button/button.json: recipes: button-group-x belongs to button-group; a tree sits in the manifest of the item whose name it starts with, the longest one',
        'ui/button/button.json: recipes: chip belongs to no item; a tree sits in the manifest of the item whose name it starts with, the longest one',
      ].join('\n'),
    )
  })
})

describe('the source manifests', () => {
  const registry = join(import.meta.dirname, '../..')

  it('each order their keys $schema, title, description, categories, recipes, composes', () => {
    const { paths } = readManifests(registry)
    expect(Object.keys(paths).length).toBeGreaterThan(100)
    const order = (keys: string[]) => keys.filter((key) => (MANIFEST_KEYS as readonly string[]).includes(key))
    for (const path of Object.values(paths)) {
      const keys = order(Object.keys(JSON.parse(readFileSync(join(registry, path), 'utf8'))))
      expect(keys, path).toEqual([...keys].sort((a, b) => MANIFEST_KEYS.indexOf(a as never) - MANIFEST_KEYS.indexOf(b as never)))
    }
  })
})

describe('manifestPath', () => {
  it('is <tier>/<name>/<name>.json for a component and <tier>/<name>.json beside a lib or composable', () => {
    expect(manifestPath('ui', 'card')).toBe('ui/card/card.json')
    expect(manifestPath('composables', 'use-x')).toBe('composables/use-x.json')
  })
})

describe('item.schema.json', () => {
  const registry = join(import.meta.dirname, '../..')
  const schema = JSON.parse(readFileSync(join(registry, 'item.schema.json'), 'utf8'))
  const validate = new Ajv({ strict: false, allErrors: true }).compile(schema)

  it('accepts every manifest in the registry', () => {
    const { paths } = readManifests(registry)
    expect(Object.keys(paths).length).toBeGreaterThan(100)
    for (const path of Object.values(paths)) expect(validate(JSON.parse(readFileSync(join(registry, path), 'utf8'))), `${path}: ${JSON.stringify(validate.errors)}`).toBe(true)
  })

  it('names the manifest keys in order, then what a stack’s stored item adds, and refuses any other', () => {
    expect(Object.keys(schema.properties)).toEqual([...MANIFEST_KEYS, 'type', 'files', 'dependencies', 'devDependencies', 'registryDependencies', 'meta'])
    expect(validate({ name: 'x', title: 'x', description: 'd' })).toBe(true)
    expect(validate({ name: 'X Y', title: 'x', description: 'd' })).toBe(false)
    expect(validate({ title: 'x', description: 'd', label: 'x' })).toBe(false)
    expect(validate({ title: 'x', recipes: {} }), 'an authored manifest without a description').toBe(false)
    expect(validate({ name: 'x', type: 'registry:ui', files: [] }), 'a stored item without a title').toBe(true)
    const stored = {
      title: 'x',
      description: 'd',
      type: 'registry:ui',
      files: [{ path: 'components/ui/x/X.vue', type: 'registry:ui', target: 'x', content: '' }],
      dependencies: ['reka-ui'],
      devDependencies: ['tw-animate-css'],
      registryDependencies: ['button'],
      meta: { frontic: { props: [{ name: 'size' }], source: { registry: 'frontic-ui', item: 'x', commit: null } } },
    }
    expect(validate(stored), JSON.stringify(validate.errors)).toBe(true)
    expect(validate({ ...stored, meta: { frontic: { source: { registry: 'frontic-ui', item: 'x' } } } })).toBe(false)
    expect(validate({ title: 'x', description: 'd', recipes: { x: { composes: ['disabled'], base: {} } } })).toBe(true)
    expect(validate({ title: 'x', description: 'd', recipes: { x: { base: {}, composes: [] } } })).toBe(false)
    expect(validate({ title: 'x', description: 'd', meta: { frontic: { recipes: {} } } })).toBe(false)
    expect(validate({ title: 'x' })).toBe(false)
    expect(validate({ title: 'x', description: 'd', composes: ['disabled'] }), 'an authored manifest with a top-level composes').toBe(false)
    expect(validate({ name: 'x', type: 'registry:ui', composes: ['disabled'] }), 'a stored item with a top-level composes').toBe(true)
    expect(validate({ title: 'x', description: 'd', recipes: { x: { composes: ['disabled'] } } }), 'a tree holding only composes').toBe(true)
  })
})

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readSourceItems } from '../../scripts/lib/items'

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'items-'))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

describe('readSourceItems', () => {
  it('leaves an item’s manifest out of its files: its recipes travel in the served item’s recipes, never as source', () => {
    const items = readSourceItems(tree({ 'ui/button/Button.vue': '<template />', 'ui/button/button.json': '{}', 'ui/button/parts/button.json': '{}', 'lib/format.ts': '', 'lib/format.json': '{}' }))
    expect(Object.keys(items[0]!.files)).toEqual(['Button.vue', 'parts/button.json'])
    expect(Object.keys(items[1]!.files)).toEqual(['format.ts'])
  })

  it('refuses a recipe file in the 0.9 shape, naming the manifest its trees belong in', () => {
    expect(() => readSourceItems(tree({ 'ui/button/Button.vue': '', 'ui/button/button-icon.recipe.json': '{}' }))).toThrow(
      'ui/button/button-icon.recipe.json: a 0.9 recipe file; an item’s trees sit in its manifest, ui/button/button.json',
    )
  })
  it('reads each tier folder as items with their files, nested ones included', () => {
    const root = tree({
      'ui/badge/Badge.vue': '<template />',
      'ui/badge/index.ts': "export { default as Badge } from './Badge.vue'",
      'ui/badge/parts/Dot.vue': '<template />',
      'sections/hero/Hero.vue': '<template />',
    })
    const items = readSourceItems(root)
    expect(items.map((i) => [i.tier, i.name, i.type])).toEqual([
      ['ui', 'badge', 'registry:ui'],
      ['sections', 'hero', 'registry:component'],
    ])
    expect(Object.keys(items[0]!.files)).toEqual(['Badge.vue', 'index.ts', 'parts/Dot.vue'])
  })

  it('skips dotfiles', () => {
    const root = tree({ 'ui/badge/Badge.vue': '', 'ui/badge/.DS_Store': '' })
    expect(Object.keys(readSourceItems(root)[0]!.files)).toEqual(['Badge.vue'])
  })

  it.each(['3d-card', 'a--b', 'card-', 'Badge', 'index', 'registry'])('refuses the item name %s', (name) => {
    expect(() => readSourceItems(tree({ [`ui/${name}/X.vue`]: '' }))).toThrow(name)
  })

  it('refuses one name in two tiers', () => {
    expect(() => readSourceItems(tree({ 'ui/card/Card.vue': '', 'sections/card/Card.vue': '' }))).toThrow(/card/)
  })

  // The long path is nested: one 260-byte name would hit the file system's own 255-byte limit first.
  it.each(['Bad ge.vue', 'Ba$dge.vue', `${'a/'.repeat(130)}x.vue`])('refuses the file name %s', (file) => {
    expect(() => readSourceItems(tree({ [`ui/badge/${file}`]: '' }))).toThrow(/refuses/)
  })

  it('reads lib/<name>.ts and composables/<name>.ts as one-file items', () => {
    const items = readSourceItems(tree({ 'lib/format.ts': 'export {}', 'composables/use-field-control.ts': 'export const x = 1' }))
    expect(items.find((i) => i.name === 'format')).toMatchObject({ tier: 'lib', type: 'registry:lib', files: { 'format.ts': 'export {}' } })
    expect(items.find((i) => i.name === 'use-field-control')).toMatchObject({ tier: 'composables', type: 'registry:composable', files: { 'use-field-control.ts': 'export const x = 1' } })
  })

  it('refuses a lib name an item already has', () => {
    expect(() => readSourceItems(tree({ 'sections/filters/Filters.vue': '', 'lib/filters.ts': '' }))).toThrow('filters is in both sections/ and lib/')
  })

  it('refuses anything in lib/ but a <name>.ts file', () => {
    expect(() => readSourceItems(tree({ 'lib/format/index.ts': '' }))).toThrow('lib/format is not a registry lib item')
    expect(() => readSourceItems(tree({ 'composables/useThing.ts': '' }))).toThrow('composables/useThing.ts is not a registry composables item')
  })
})

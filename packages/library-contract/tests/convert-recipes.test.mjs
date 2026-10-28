import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { convertRecipeFolder } from '../src/brand.mjs'
import { convertRecipeFiles, readRecipeFiles, recipeFileText } from '../src/recipe.mjs'

const file = (path, value) => ({ path, text: JSON.stringify(value) })
const OLD = [
  file('recipes/card.json', { base: { borderColor: '{colors.border}' } }),
  file('recipes/card-header.json', { base: { gap: '{spacing.2}' } }),
  file('recipes/drawer-content.json', { base: {} }),
  file('recipes/swatch.json', { variants: { tone: { muted: {} } } }),
  file('recipes/shared/focus-ring.json', { outlineColor: '{colors.ring}' }),
  file('recipes/shared/link-primary.json', { link: { textColor: '{colors.primary}' } }),
]

describe('convertRecipeFiles', () => {
  it('groups each tree into its owner’s file, each flat recipe into its own shared file, and removes the files left over', () => {
    const { writes, removes, problems } = convertRecipeFiles(OLD, ['card', 'drawer', 'swatch', 'filter'])
    expect(problems).toEqual([])
    expect(writes).toEqual([
      { path: 'recipes/card.json', text: recipeFileText({ card: { base: { borderColor: '{colors.border}' } }, 'card-header': { base: { gap: '{spacing.2}' } } }) },
      { path: 'recipes/drawer.json', text: recipeFileText({ 'drawer-content': { base: {} } }) },
      { path: 'recipes/shared/focus-ring.json', text: recipeFileText({ 'focus-ring': { outlineColor: '{colors.ring}' } }) },
      { path: 'recipes/shared/link-primary.json', text: recipeFileText({ 'link-primary': { link: { textColor: '{colors.primary}' } } }) },
      { path: 'recipes/swatch.json', text: recipeFileText({ swatch: { variants: { tone: { muted: {} } } } }) },
    ])
    expect(removes).toEqual(['recipes/card-header.json', 'recipes/drawer-content.json'])
  })

  it('reads back as the recipes it was given', () => {
    const { writes } = convertRecipeFiles(OLD, ['card', 'drawer', 'swatch'])
    const read = readRecipeFiles(writes)
    expect(read.problems).toEqual([])
    expect(Object.keys(read.trees).sort()).toEqual(['card', 'card-header', 'drawer-content', 'swatch'])
    expect(Object.keys(read.flat).sort()).toEqual(['focus-ring', 'link-primary'])
  })

  it('without item names, groups a part under the tree that prefixes it and leaves the rest in a file of their own', () => {
    const { writes } = convertRecipeFiles(OLD, [])
    expect(writes.map((w) => w.path)).toEqual(['recipes/card.json', 'recipes/drawer-content.json', 'recipes/shared/focus-ring.json', 'recipes/shared/link-primary.json', 'recipes/swatch.json'])
  })

  it('puts the owner’s own tree first, then its parts by name', () => {
    const { writes } = convertRecipeFiles([file('recipes/card-title.json', { base: {} }), file('recipes/card-action.json', { base: {} }), file('recipes/card.json', { base: {} })], ['card'])
    expect(Object.keys(JSON.parse(writes[0].text))).toEqual(['$schema', 'card', 'card-action', 'card-title'])
  })

  it('changes nothing in a converted folder', () => {
    const { writes } = convertRecipeFiles(OLD, ['card', 'drawer', 'swatch'])
    expect(convertRecipeFiles(writes, ['card', 'drawer', 'swatch'])).toEqual({ writes: [], removes: [], problems: [] })
  })

  it('refuses a folder holding both shapes and converts nothing', () => {
    const result = convertRecipeFiles([file('recipes/card.json', { card: { base: {} } }), file('recipes/button.json', { base: {} })], ['card', 'button'])
    expect(result).toEqual({ writes: [], removes: [], problems: ['recipes: holds both shapes, recipes/card.json converted and recipes/button.json not; convert from one shape'] })
  })

  it('refuses a folder with a file it cannot read, or a name two files define, and converts nothing', () => {
    expect(convertRecipeFiles([...OLD, file('recipes/bad.json', [])], ['card']).writes).toEqual([])
    expect(convertRecipeFiles([...OLD, { path: 'recipes/x.json', text: '{' }], ['card']).problems[0]).toMatch(/^recipes\/x\.json: not JSON/)
    expect(convertRecipeFiles([file('recipes/card.json', { base: {} }), file('recipes/shared/card.json', { color: 'x' })], []).problems).toEqual([
      'recipes/shared/card.json: card: defined in recipes/card.json too',
    ])
  })
})

const run = promisify(execFile)
const BIN = path.join(import.meta.dirname, '../bin/frontic-convert-recipes.mjs')

async function library(files) {
  const dir = await mkdtemp(path.join(tmpdir(), 'convert-recipes-'))
  await writeFile(path.join(dir, 'registry.json'), JSON.stringify({ items: [{ name: 'card' }, { name: 'drawer' }, { name: 'swatch' }] }))
  for (const { path: p, text } of files) {
    await mkdir(path.dirname(path.join(dir, p)), { recursive: true })
    await writeFile(path.join(dir, p), text)
  }
  return dir
}

async function snapshot(dir) {
  const out = {}
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) out[path.relative(dir, path.join(entry.parentPath, entry.name))] = await readFile(path.join(entry.parentPath, entry.name), 'utf8')
  }
  return out
}

const exitOf = (promise) => promise.then((r) => ({ code: 0, ...r })).catch((e) => ({ code: e.code, stdout: e.stdout, stderr: e.stderr }))

describe('convertRecipeFolder', () => {
  it('rewrites a library’s recipes/ in place, item names from its registry.json', async () => {
    const dir = await library(OLD)
    const result = await convertRecipeFolder(dir)
    expect(result.problems).toEqual([])
    const after = await snapshot(dir)
    expect(Object.keys(after).sort()).toEqual([
      'recipes/card.json',
      'recipes/drawer.json',
      'recipes/shared/focus-ring.json',
      'recipes/shared/link-primary.json',
      'recipes/swatch.json',
      'registry.json',
    ])
    expect(JSON.parse(after['recipes/card.json'])['card-header']).toEqual({ base: { gap: '{spacing.2}' } })
  })

  it('with check, writes nothing and returns what it would do', async () => {
    const dir = await library(OLD)
    const before = await snapshot(dir)
    const result = await convertRecipeFolder(dir, { check: true })
    expect(result.removes).toEqual(['recipes/card-header.json', 'recipes/drawer-content.json'])
    expect(await snapshot(dir)).toEqual(before)
  })
})

describe('frontic-convert-recipes', () => {
  it('--check prints each file it would write or delete, exits 1, and leaves the folder byte-identical', async () => {
    const dir = await library(OLD)
    const before = await snapshot(dir)
    const { code, stdout } = await exitOf(run(process.execPath, [BIN, dir, '--check']))
    expect(code).toBe(1)
    expect(stdout.split('\n').filter(Boolean)).toEqual([
      'write recipes/card.json',
      'write recipes/drawer.json',
      'write recipes/shared/focus-ring.json',
      'write recipes/shared/link-primary.json',
      'write recipes/swatch.json',
      'delete recipes/card-header.json',
      'delete recipes/drawer-content.json',
    ])
    expect(await snapshot(dir)).toEqual(before)
  })

  it('converts, then --check exits 0 and a second run changes nothing', async () => {
    const dir = await library(OLD)
    expect((await exitOf(run(process.execPath, [BIN, dir]))).code).toBe(0)
    const converted = await snapshot(dir)
    const check = await exitOf(run(process.execPath, [BIN, dir, '--check']))
    expect(check).toMatchObject({ code: 0, stdout: '' })
    await run(process.execPath, [BIN, dir])
    expect(await snapshot(dir)).toEqual(converted)
  })

  it('exits 2 and writes nothing on a folder holding both shapes, naming the problem', async () => {
    const dir = await library([file('recipes/card.json', { card: { base: {} } }), file('recipes/button.json', { base: {} })])
    const before = await snapshot(dir)
    const { code, stderr } = await exitOf(run(process.execPath, [BIN, dir]))
    expect(code).toBe(2)
    expect(stderr).toContain('holds both shapes')
    expect(await snapshot(dir)).toEqual(before)
  })

  it('exits 2 without a library folder', async () => {
    expect((await exitOf(run(process.execPath, [BIN]))).code).toBe(2)
  })
})

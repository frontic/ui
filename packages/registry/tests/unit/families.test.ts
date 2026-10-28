import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRegistry, contractFiles } from '../../scripts/build'
import { familyTableProblems, ownLook, placement, type FamilyTable, type ServedFamilyTable } from '../../scripts/lib/families'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import type { ServedItem } from '../../scripts/lib/served'

const root = join(import.meta.dirname, '../..')
const table = JSON.parse(readFileSync(join(root, 'families.json'), 'utf8')) as FamilyTable
const OWN_LOOK =
  'aspect-ratio avatar badge breadcrumb button-group collapsible date-picker date-range-picker form image kbd mega-menu pagination payment-card rating rating-input scroll-area skeleton spinner swatch swatch-group switch tabs toggle toggle-group tooltip account-access delivery-slot product-options promo-code recent-orders settings shipping-address sign-in team-members header-checkout'.split(
    ' ',
  )
const flat = Object.keys(readRegistryRecipes(root).flat)

const item = (recipes: Record<string, object>, composes: string[] = []): ServedItem => {
  const tree = (def: object) => 'base' in def || 'variants' in def
  const own: Record<string, object> = Object.fromEntries(Object.entries(recipes).filter(([, def]) => tree(def)))
  const library = Object.entries(recipes).filter(([, def]) => !tree(def))
  if (composes.length) own.x = { composes, ...own.x }
  return { name: 'x', recipes: own, library: { recipes: Object.fromEntries(library) }, files: [] } as unknown as ServedItem
}
const uses = (...families: string[]) => ({ base: { extends: families[0] }, variants: { tone: Object.fromEntries(families.slice(1).map((f, i) => [`t${i}`, { extends: f }])) } })
const flatRecipe = { textColor: '{colors.foreground}' }

describe('families.json', () => {
  it('names every family the registry’s recipe files define, each in one group', () => {
    expect(familyTableProblems(table, flat)).toEqual([])
  })

  it('carries the storefront row', () => {
    expect(table.groups.find((g) => g.group === 'storefront')?.families).toEqual([
      'heading',
      'title',
      'logo',
      'meta',
      'link',
      'total',
      'note-positive',
      'nav-trigger',
      'dismiss',
      'copy-muted',
      'line-title',
      'thumbnail',
      'page-title',
      'quiet-action',
      'clear-link',
      'section-title',
    ])
  })

  it('reports an unnamed family and a family in two groups', () => {
    const planted: FamilyTable = {
      groups: [
        { group: 'a', title: 'A', families: ['x', 'y'] },
        { group: 'b', title: 'B', families: ['y'] },
      ],
    }
    expect(familyTableProblems(planted, ['x', 'z'])).toEqual(['family y is in two groups', 'z is a family no group names'])
  })
})

describe('placement', () => {
  const groups: FamilyTable = {
    groups: [
      { group: 'a', title: 'A', families: ['pill'] },
      { group: 'b', title: 'B', families: ['panel'] },
    ],
  }
  const place = (i: ServedItem, items = ['x']) => placement(groups, i, items)

  it('takes the group its parts use most often, inner parts included, each family once per part', () => {
    expect(place(item({ x: uses('panel', 'panel', 'panel'), 'x-a': uses('pill'), 'x-b': uses('pill') }))).toEqual({ group: 'a', counts: { a: 2, b: 1 }, by: 'count' })
  })

  it('counts a part that wears a family, never a shared state, and only trees treeOwner gives the item', () => {
    const worn = item({ 'x-a': uses('pill'), panel: flatRecipe, 'focus-ring': flatRecipe, 'x-group': uses('pill') }, ['panel', 'focus-ring'])
    expect(place(worn, ['x', 'x-group'])).toEqual({ group: null, counts: { a: 1, b: 1 }, by: 'tie' })
  })

  it('breaks a tie by the main recipe: the tree named like the item, else its default or root part', () => {
    expect(place(item({ x: uses('pill'), 'x-a': uses('panel') }))).toEqual({ group: 'a', counts: { a: 1, b: 1 }, by: 'main' })
    expect(place(item({ 'x-root': uses('panel'), 'x-a': uses('pill') }))).toEqual({ group: 'b', counts: { a: 1, b: 1 }, by: 'main' })
  })

  it('breaks a tie the main recipe cannot read by the tied group the <item>-content tree uses most, never another', () => {
    expect(place(item({ 'x-content': uses('pill'), 'x-title': uses('panel') }))).toEqual({ group: 'a', counts: { a: 1, b: 1 }, by: 'content' })
    expect(place(item({ 'x-content': uses('pill', 'panel'), 'x-title': uses('panel', 'pill') })).by).toBe('tie')
    const c: FamilyTable = { groups: [...groups.groups, { group: 'c', title: 'C', families: ['notice'] }] }
    expect(placement(c, item({ 'x-content': uses('notice'), 'x-a': uses('pill'), 'x-b': uses('panel'), 'x-c': uses('pill'), 'x-d': uses('panel') }), ['x'])).toEqual({
      group: null,
      counts: { a: 2, b: 2, c: 1 },
      by: 'tie',
    })
  })

  it('places nowhere a tie without a main recipe, or an item whose trees use no family', () => {
    expect(place(item({ 'x-a': uses('panel'), 'x-b': uses('pill') })).group).toBeNull()
    expect(place(item({ x: { base: {} } }))).toEqual({ group: null, counts: {}, by: 'none' })
  })
})

describe('the served family table', () => {
  it('derives each group’s items from its parts’ counts; every item it places nowhere is Own look', async () => {
    const { served, files } = await contractFiles(root)
    const derived = files['families.json'] as ServedFamilyTable
    const groupOf = (name: string) => derived.groups.find((g) => g.items.includes(name))?.group ?? null
    expect(['button', 'dropdown-menu', 'calendar', 'dialog', 'select', 'filter', 'rating'].map(groupOf)).toEqual(['action', 'menu', 'calendar', 'overlay', 'control', 'text', null])
    expect(ownLook(derived, served)).toEqual(OWN_LOOK)
    expect(derived.groups.map(({ items: _items, ...g }) => g)).toEqual(table.groups)
  }, 90_000)

  it('is written beside the index, and a build refuses a missing table or one with problems', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'families-'))
    const write = (path: string, text: string) => {
      mkdirSync(join(dir, path, '..'), { recursive: true })
      writeFileSync(join(dir, path), text)
    }
    write('ui/card/Card.vue', '<template><div class="fui-card" /></template>')
    write('ui/card/card.json', JSON.stringify({ recipes: { card: { base: { extends: 'pill' } } } }))
    write('pending.json', JSON.stringify({ items: [] }))
    write('recipes/shared/pill.json', JSON.stringify({ pill: { rounded: '{rounded.full}' } }))
    write('icons/legacy-mapping.json', '{}')
    try {
      write('families.json', JSON.stringify({ groups: [{ group: 'pill', title: 'Pill', families: ['pill'] }] }))
      await buildRegistry({ root: dir, out: join(dir, 'out') })
      expect(JSON.parse(readFileSync(join(dir, 'out/families.json'), 'utf8'))).toEqual({ groups: [{ group: 'pill', title: 'Pill', families: ['pill'], items: ['card'] }] })
      write('families.json', JSON.stringify({ groups: [] }))
      await expect(buildRegistry({ root: dir, out: join(dir, 'out') })).rejects.toThrow('pill is a family no group names')
      rmSync(join(dir, 'families.json'))
      await expect(buildRegistry({ root: dir, out: join(dir, 'out') })).rejects.toThrow('families.json is missing')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)
})

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildMappingFromRecords, findDuplicateCanonicals, incompleteRows, legacyConflicts, mergeLegacy } from '../../scripts/build-icons.helpers'
import { iconCoverageProblems, iconMapFromSource, scanPlaceholders, validateNames } from '../../scripts/build-icons'
import type { ServedItem } from '../../scripts/lib/served'

const root = join(import.meta.dirname, '../..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const star = { lucide: 'StarIcon', tabler: 'IconStar', hugeicons: 'StarIcon', phosphor: 'PhStar', remixicon: 'RiStarLine' }

describe('scanPlaceholders', () => {
  it('reads the static library attributes and ignores bound ones', () => {
    expect(scanPlaceholders(`<IconPlaceholder lucide="StarIcon" tabler="IconStar" :hugeicons="x" class="size-4" />`)).toEqual([{ lucide: 'StarIcon', tabler: 'IconStar' }])
  })
})

describe('buildMappingFromRecords', () => {
  it('keys by the lucide name, derives the raw Phosphor export and names the files that disagree', () => {
    const { mapping, warnings } = buildMappingFromRecords([
      { lucide: 'StarIcon', tabler: 'IconStar', phosphor: 'StarIcon', file: 'ui/a/A.vue' },
      { lucide: 'StarIcon', tabler: 'IconStarFilled', file: 'ui/b/B.vue' },
    ])
    expect(mapping.StarIcon).toEqual({ lucide: 'StarIcon', tabler: 'IconStar', phosphor: 'PhStar' })
    expect(warnings).toEqual(['StarIcon fails: tabler "IconStar" in ui/a/A.vue, "IconStarFilled" in ui/b/B.vue; make the placeholders agree'])
  })
})

describe('mergeLegacy', () => {
  it('fills only what no placeholder names, through the Icon bridge, and appends the rest sorted', () => {
    const merged = mergeLegacy({ Star: { lucide: 'Star', tabler: 'IconStar', hugeicons: 'StarLegacyIcon' } }, { StarIcon: { ...star, hugeicons: '' }, CheckIcon: { lucide: 'CheckIcon' } })
    expect(Object.keys(merged)).toEqual(['Star', 'CheckIcon'])
    expect(merged.Star).toEqual({ ...star, lucide: 'Star', hugeicons: 'StarLegacyIcon' })
  })

  it('refuses a placeholder that names a different icon than its legacy row', () => {
    const legacy = { Star: { lucide: 'Star', tabler: 'IconStarLegacy' }, CheckIcon: { lucide: 'CheckIcon', tabler: 'IconCheck' } }
    expect(legacyConflicts(legacy, { StarIcon: star, CheckIcon: { lucide: 'CheckIcon', tabler: 'IconCheck' } })).toEqual([
      'StarIcon: the placeholder names tabler "IconStar", the legacy row Star names "IconStarLegacy"',
    ])
  })
})

describe('row checks', () => {
  it('finds a key held twice and a row missing a library', () => {
    expect(findDuplicateCanonicals({ Star: star, StarIcon: star })).toEqual(['Star'])
    expect(incompleteRows({ StarIcon: { ...star, hugeicons: '' }, CheckIcon: { lucide: 'CheckIcon' } })).toEqual([
      'CheckIcon: no tabler, hugeicons, phosphor, remixicon name',
      'StarIcon: no hugeicons name',
    ])
  })
})

describe('validateNames', () => {
  it('names an export its package lacks', async () => {
    expect(await validateNames({ StarIcon: { ...star, phosphor: 'PhNotAnIcon' } })).toEqual(['StarIcon: phosphor export "PhNotAnIcon" not found in @phosphor-icons/vue'])
  })
})

describe('iconMapFromSource', () => {
  const planted: string[] = []
  afterAll(() => planted.forEach((dir) => rmSync(dir, { recursive: true, force: true })))
  const plant = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), 'build-icons-'))
    planted.push(dir)
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true })
      writeFileSync(join(dir, rel), text)
    }
    return dir
  }
  const placeholder = (row: Record<string, string>) =>
    `<IconPlaceholder ${Object.entries(row)
      .map(([l, n]) => `${l}="${l === 'phosphor' ? n.replace(/^Ph/, '') + 'Icon' : n}"`)
      .join(' ')} />`
  const plus = { lucide: 'PlusIcon', tabler: 'IconPlus', hugeicons: 'PlusSignIcon', phosphor: 'PhPlus', remixicon: 'RiAddLine' }

  it('refuses two placeholders that name different icons', async () => {
    const dir = plant({ 'icons/legacy-mapping.json': '{}', 'ui/a/A.vue': placeholder(star), 'ui/b/B.vue': placeholder({ ...star, tabler: 'IconStarFilled' }) })
    await expect(iconMapFromSource(dir)).rejects.toThrow('StarIcon fails: tabler "IconStar" in ui/a/A.vue, "IconStarFilled" in ui/b/B.vue')
  })

  it('refuses a placeholder that names a different icon than its legacy row', async () => {
    const dir = plant({ 'icons/legacy-mapping.json': JSON.stringify({ PlusIcon: plus }), 'ui/a/A.vue': placeholder({ ...plus, tabler: 'IconPlusEqual' }) })
    await expect(iconMapFromSource(dir)).rejects.toThrow('PlusIcon: the placeholder names tabler "IconPlusEqual", the legacy row PlusIcon names "IconPlus"')
  })
})

describe('the map frontic/ui serves', async () => {
  const map = await iconMapFromSource(root)

  it('has every icon the source names, in all five libraries', () => {
    expect(map.StarIcon).toEqual(star)
    expect(map.RotateCcwIcon?.phosphor).toBe('PhArrowCounterClockwise')
    expect(map.PanelLeftIcon).toMatchObject({ hugeicons: 'LayoutLeftIcon', phosphor: 'PhSidebarSimple' })
    expect(map.Loader2Icon?.phosphor).toBe('PhCircleNotch')
    expect(map.PlusIcon?.hugeicons).toBe('PlusSignIcon')
    expect(incompleteRows(map)).toEqual([])
  })

  it('fills the six HugeIcons names upstream lacks', () => {
    for (const name of ['ArrowUpDown', 'BellRing', 'GripVertical', 'MailOpen', 'Slash', 'Terminal']) expect(map[`${name}Icon`]?.hugeicons, name).toBe(`${name}Icon`)
  })

  it('keys every row by the export the served files import', () => {
    expect(Object.entries(map).filter(([key, row]) => !key.endsWith('Icon') || row.lucide !== key)).toEqual([])
  })

  it('carries no library the stack does not install', () => {
    expect(
      Object.values(map)
        .flatMap(Object.keys)
        .filter((l) => !['lucide', 'tabler', 'hugeicons', 'phosphor', 'remixicon'].includes(l)),
    ).toEqual([])
  })

  it('pins the packages the stack installs into projects', () => {
    // keep in sync with ICON_LIBRARIES in the stack's apps/library-core/src/icons.mjs
    const PINS: Record<string, string> = {
      '@lucide/vue': '1.52.0',
      '@tabler/icons-vue': '3.48.0',
      '@hugeicons/vue': '1.0.8',
      '@hugeicons/core-free-icons': '4.3.5',
      '@phosphor-icons/vue': '2.2.1',
      '@remixicon/vue': '4.9.0',
    }
    for (const [name, version] of Object.entries(PINS)) expect(pkg.devDependencies[name] ?? pkg.dependencies[name], name).toBe(version)
  })
})

const servedWith = (path: string, content: string): ServedItem => ({
  name: 'x',
  type: 'registry:ui',
  files: [{ path, type: 'registry:example', content }],
  recipes: {},
})

describe('iconCoverageProblems', () => {
  it('reads every served file, a demo’s value import included, through the Icon bridge', () => {
    const map = { Star: star, CheckIcon: { ...star, lucide: 'CheckIcon' } }
    expect(iconCoverageProblems(map, [servedWith('components/ui/x/x.example.vue', `<script setup>\nimport { StarIcon, CheckIcon, NotMappedIcon } from '@lucide/vue'\n</script>`)])).toEqual([
      'NotMappedIcon is imported from @lucide/vue in components/ui/x/x.example.vue; give it an IconPlaceholder or a row in icons/legacy-mapping.json',
    ])
  })
})

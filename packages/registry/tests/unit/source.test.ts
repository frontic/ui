import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { recipeSetProblems, RECIPE_STATES } from '@frontic/library-contract/recipe'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'
import { readSourceItems, sourcePath } from '../../scripts/lib/items'
import { keptLayout } from '../../scripts/lib/template-layout'
import {
  componentProblems,
  defaultBrandNames,
  foreignTreeProblems,
  ownedTrees,
  paletteProblems,
  readRegistryRecipes,
  recipeDefinitionProblems,
  itemComposesProblems,
  recipeMapProblems,
  recipePlacementProblems,
} from '../../scripts/lib/recipes'
import { readManifests } from '../../scripts/lib/manifests'
import { recipeMap } from '@frontic/library-contract/item'

const root = join(import.meta.dirname, '../..')
const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'))
const pending = new Set<string>(read('pending.json').items)
const entries = new Map(readManifests(root).entries.map((e) => [e.name, e]))
const names = defaultBrandNames()
const items = [...entries.keys()]
const served = readSourceItems(root).filter((i) => !pending.has(i.name))

const generic = readRegistryRecipes(root)
const FAMILIES: Record<string, string[]> = Object.fromEntries((read('families.json').groups as { group: string; families: string[] }[]).map((g) => [g.group, g.families]))

describe('the generic recipes', () => {
  it('reference only the default brand', () => {
    expect(recipeDefinitionProblems(generic, names)).toEqual([])
  })
  it('give every class and every variable one recipe', () => {
    expect(recipeSetProblems(generic)).toEqual([])
  })
  it('define every family recipe', () => {
    expect(Object.keys(generic.flat)).toEqual(expect.arrayContaining(Object.values(FAMILIES).flat()))
    expect(Object.keys(generic.flat).filter((name) => !Object.values(FAMILIES).flat().includes(name))).toEqual([])
  })
  it('set the file button, ui and small text at 14px on a 20px line', () => {
    const css = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), generic, { scope: 'project' })
    expect(css).toContain('--fui-text-sm: 0.875rem;')
    for (const name of ['ui', 'small']) expect(css).toContain(`--fui-text-${name}-size: var(--fui-text-sm);\n  --fui-text-${name}-line-height: 1.43;`)
    expect(css).toContain('--fui-control-line-file-font-size: var(--fui-text-ui-size);\n  --fui-control-line-file-line-height: var(--fui-text-ui-line-height);')
  })
  it('render a checked checkbox filled and a checked radio as a foreground dot', async () => {
    const base = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), generic, { scope: 'project' })
    const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['fui-choice', 'fui-choice-box', 'fui-choice-dot'])
    const rule = (name: string) => css.slice(css.indexOf(`.${name} {`), css.indexOf('\n}\n', css.indexOf(`.${name} {`)))
    const checked = RECIPE_STATES.checked
    expect(rule('fui-choice')).not.toContain(checked)
    expect(rule('fui-choice-box')).toContain(`${checked} {\n    background-color: var(--fui-choice-box-checked-background-color);`)
    expect(rule('fui-choice-dot')).toContain(`${checked} svg {\n    color: var(--fui-choice-dot-checked-icon-color);`)
    expect(rule('fui-choice-dot')).not.toContain('background-color')
    expect(base).toContain('--fui-choice-box-checked-background-color: var(--fui-primary);')
    expect(base).toContain('--fui-choice-dot-checked-icon-color: var(--fui-foreground);')
  })
  it('pin the finer family variants', () => {
    expect(generic.flat['overlay-sheet']).toEqual({ backgroundColor: '{colors.background}', shadow: '{shadow.md}', typography: '{typography.small}' })
    expect(generic.flat['part-title-lg']).toEqual({ typography: '{typography.lead}', fontWeight: 'semibold', letterSpacing: 'wider', textTransform: 'uppercase' })
    expect(generic.flat.label).toEqual({ typography: '{typography.caption}', fontWeight: 'semibold', letterSpacing: 'wide', textTransform: 'uppercase' })
    expect(generic.flat['choice-dot']).toEqual({ rounded: '{rounded.full}', checked: { borderColor: '{colors.foreground}', iconColor: '{colors.foreground}' } })
  })
  it('sit beside the item that maps each tree, every flat recipe in recipes/shared/', () => {
    const maps = served.map((i) => ({ name: i.name, tier: i.tier, recipes: recipeMap(entries.get(i.name) ?? { name: i.name }) }))
    expect(recipePlacementProblems(generic, maps)).toEqual([])
  })
})

describe.runIf(served.length)('every served item', () => {
  it.each(served.map((i) => [i.name, i] as const))('%s maps its recipes and keeps its look in them', (_name, item) => {
    const entry = entries.get(item.name)
    if (!entry) throw new Error(`${item.name} is served but has no manifest`)
    const problems = [
      ...recipeMapProblems(item, entry, generic.trees),
      ...itemComposesProblems(item, entry, generic.flat),
      ...foreignTreeProblems(item.name, recipeMap(entry), new Set(Object.keys(generic.trees)), items),
      ...ownedTrees(item.name, recipeMap(entry), items).flatMap((tree) => (generic.trees[tree] ? componentProblems(item, generic.trees[tree], tree) : [`${tree} is no tree in the recipe files`])),
      ...Object.entries(item.files)
        .filter(([f]) => f !== `${item.name}.example.vue`)
        .flatMap(([f, t]) => paletteProblems(f, t, names, keptLayout(sourcePath(item, f)))),
    ]
    expect(problems).toEqual([])
  })
})

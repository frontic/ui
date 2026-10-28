import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { recipeEntries, treeEntries } from '@frontic/library-contract/recipe'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
const recipes = readRegistryRecipes(root)
const base = renderBaseCss(brand, recipes, { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')
const entries = Object.entries(recipes.trees).flatMap(([name, tree]) => treeEntries(name, tree, recipes.flat))
// Every class the registry's recipes make: one per flat recipe, one per base and value of each component tree; a pair makes none.
const emitted = [...Object.keys(recipes.flat), ...entries.filter((entry) => entry.layer !== 'compound').map((entry) => entry.name)].map((name) => `fui-${name}`)
// Every pair the registry's recipes write, with its value classes and the CSS properties its own declarations set.
const pairs = entries
  .filter((entry) => entry.layer === 'compound')
  .map((entry) => ({
    name: entry.name,
    classes: entry.classes!.map((cls) => `fui-${cls}`),
    properties: [
      ...new Set(
        recipeEntries(recipes)
          .find((e) => e.recipe === entry.name)!
          .vars.flatMap((v) => v.properties ?? []),
      ),
    ],
  }))
const build = async (classes: string[]) => (await compile(`${base}\n@tailwind utilities;\n`)).build(classes)
const at = (css: string, selector: string) => {
  const index = css.indexOf(`${selector} {`)
  expect(index, selector).toBeGreaterThanOrEqual(0)
  return index
}

// One passed utility per CSS property a recipe sets; a shorthand lists one per longhand it resets.
const PASSED: Record<string, string[]> = {
  'background-color': ['bg-accent'],
  color: ['text-accent'],
  border: ['border-2', 'border-dashed', 'border-accent'],
  'border-top': ['border-t-2', 'border-t-accent'],
  'border-right': ['border-r-2', 'border-r-accent'],
  'border-bottom': ['border-b-2', 'border-b-accent'],
  'border-bottom-color': ['border-b-accent'],
  'border-left': ['border-l-2', 'border-l-accent'],
  'border-inline-start': ['border-s-2', 'border-s-accent'],
  'border-inline-end': ['border-e-2', 'border-e-accent'],
  'border-color': ['border-accent'],
  'border-style': ['border-dashed'],
  'border-radius': ['rounded-none', 'rounded-t-none', 'rounded-md'],
  'border-top-left-radius': ['rounded-tl-none', 'rounded-md'],
  'border-top-right-radius': ['rounded-tr-none', 'rounded-md'],
  'border-bottom-right-radius': ['rounded-br-none', 'rounded-md'],
  'border-bottom-left-radius': ['rounded-bl-none', 'rounded-md'],
  fill: ['fill-accent'],
  stroke: ['stroke-accent'],
  'border-width': ['border-2'],
  'text-decoration-line': ['no-underline'],
  'text-underline-offset': ['underline-offset-2'],
  'scrollbar-width': ['[scrollbar-width:auto]'],
  'box-shadow': ['shadow-none'],
  'container-type': ['@container'],
  'font-family': ['[font-family:serif]'],
  'font-size': ['text-[13px]', 'text-caption', 'text-ui'],
  'line-height': ['leading-9'],
  'max-width': ['max-w-sm', 'max-w-none'],
  'font-weight': ['[font-weight:700]'],
  'letter-spacing': ['[letter-spacing:0.1em]'],
  'font-style': ['not-italic'],
  'text-transform': ['normal-case'],
  'text-align': ['text-center'],
  translate: ['translate-none'],
  'font-feature-settings': ['[font-feature-settings:normal]'],
  'font-variation-settings': ['[font-variation-settings:normal]'],
  outline: ['outline-2', 'outline-dashed', 'outline-accent'],
  'outline-width': ['outline-2'],
  'outline-style': ['outline-dashed'],
  'outline-color': ['outline-accent'],
  'outline-offset': ['outline-offset-2'],
  opacity: ['opacity-75'],
  padding: ['p-4', 'px-4'],
  'padding-inline': ['px-4', 'p-4'],
  'padding-block': ['py-4', 'p-4'],
  'padding-top': ['pt-4', 'p-4'],
  'padding-bottom': ['pb-4', 'p-4'],
  'padding-inline-start': ['ps-4', 'p-4'],
  'padding-inline-end': ['pe-4', 'p-4'],
  margin: ['m-4', 'mx-4'],
  'margin-inline': ['mx-4', 'm-4', 'ms-auto'],
  'margin-block': ['my-4', 'm-4'],
  'margin-top': ['mt-4', 'm-4'],
  'margin-bottom': ['mb-4', 'm-4'],
  'margin-inline-start': ['ms-4', 'm-4'],
  'margin-inline-end': ['me-4', 'm-4'],
  gap: ['gap-4'],
  width: ['w-4', 'size-4'],
  height: ['h-4', 'size-4'],
  'min-height': ['min-h-4'],
  'min-width': ['min-w-4'],
  display: ['block', 'hidden', 'grid'],
  'flex-direction': ['flex-row', 'flex-col'],
  'flex-wrap': ['flex-nowrap', 'flex-wrap'],
  flex: ['flex-none', 'flex-1'],
  'flex-grow': ['grow', 'grow-0'],
  'flex-shrink': ['shrink', 'shrink-0'],
  'align-items': ['items-start'],
  'align-self': ['self-center'],
  'align-content': ['content-center'],
  'justify-content': ['justify-between'],
  'justify-items': ['justify-items-center'],
  'justify-self': ['justify-self-center'],
  'place-items': ['place-items-center'],
  'place-content': ['place-content-center'],
  'grid-template-columns': ['grid-cols-2'],
  'grid-template-rows': ['grid-rows-2'],
  'grid-column': ['col-span-2'],
  'grid-row': ['row-span-2'],
}
const LONGHANDS: Record<string, string[]> = {
  border: ['border-width', 'border-style', 'border-color'],
  'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],
  'border-inline-start': ['border-inline-start-width', 'border-inline-start-style', 'border-inline-start-color'],
  'border-inline-end': ['border-inline-end-width', 'border-inline-end-style', 'border-inline-end-color'],
  outline: ['outline-width', 'outline-style', 'outline-color'],
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  padding: ['padding-inline', 'padding-block', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline-start', 'padding-inline-end'],
  margin: ['margin-inline', 'margin-block', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-inline-start', 'margin-inline-end'],
  'margin-inline': ['margin-inline-start', 'margin-inline-end'],
  'margin-block': ['margin-top', 'margin-bottom'],
}

const escape = (cls: string) => `.${cls.replace(/[^A-Za-z0-9_-]/g, (c) => `\\${c}`)}`

/** Each top-level rule's own declarations, in document order; nested blocks are left out. */
function rules(css: string): { selector: string; decls: [string, string][]; total: number }[] {
  return [...css.matchAll(/^(\.\S+) \{\n([\s\S]*?)^\}/gm)].map(([, selector, body]) => ({
    selector: selector!,
    decls: [...body!.matchAll(/^ {2}([a-z-]+): (.+);$/gm)].map(([, prop, value]) => [prop!, value!] as [string, string]),
    total: [...body!.matchAll(/^ +[a-z-]+: .+;$/gm)].length,
  }))
}

/** The rule whose declaration sets `property` last among `selectors`, a shorthand counting for its longhands. */
function winner(all: ReturnType<typeof rules>, selectors: string[], property: string): string | undefined {
  let last: string | undefined
  for (const rule of all.filter((r) => selectors.includes(r.selector))) {
    if (rule.decls.some(([prop]) => prop === property || LONGHANDS[prop]?.includes(property))) last = rule.selector
  }
  return last
}

describe('a class passed to a component styled by recipes', () => {
  it('beats every multi-property class the registry’s recipes make, sizes included, on every property it sets', async () => {
    const classes = emitted
    const utilities = [...new Set(Object.values(PASSED).flat())]
    const css = await build([...classes, ...utilities])
    const all = rules(css)
    const losses: string[] = []
    let pairs = 0
    for (const cls of classes) {
      const recipe = all.find((r) => r.selector === escape(cls))
      // A value that sets only states, the icon part or the icon colour renders no rule of its own, only its nested blocks.
      if (!recipe) {
        expect(
          [`${escape(cls)}:`, `${escape(cls)} :where(`, `${escape(cls)} svg`].some((nested) => css.includes(nested)),
          cls,
        ).toBe(true)
        continue
      }
      if (recipe.total < 2) continue
      for (const [prop] of recipe.decls.filter(([p]) => !p.startsWith('--'))) {
        expect(PASSED[prop], `${cls} sets ${prop}; add a passed utility for it`).toBeDefined()
        for (const utility of PASSED[prop]!) {
          const passed = all.find((r) => r.selector === escape(utility))
          expect(passed, utility).toBeDefined()
          for (const [longhand] of passed!.decls.filter(([p]) => !p.startsWith('--'))) {
            pairs++
            if (winner(all, [recipe.selector, passed!.selector], longhand) !== passed!.selector) losses.push(`${cls} + ${utility}: ${longhand}`)
          }
        }
      }
    }
    expect(classes).toEqual(expect.arrayContaining(['fui-button', 'fui-button-outline', 'fui-button-xs', 'fui-badge-sm', 'fui-input', 'fui-textarea']))
    expect(classes).not.toContain('fui-button-solid-primary')
    expect(pairs).toBeGreaterThan(565)
    expect(losses).toEqual([])
  })

  it('a passed gap beats the gap a recipe sets: field’s label and a spaced toggle group', async () => {
    expect(emitted).toEqual(expect.arrayContaining(['fui-field-label', 'fui-toggle-group-sm']))
    const all = rules(await build(['fui-field-label', 'fui-toggle-group-sm', 'gap-4']))
    for (const cls of ['.fui-field-label', '.fui-toggle-group-sm']) {
      expect(winner(all, [cls], 'gap'), cls).toBe(cls)
      expect(winner(all, [cls, '.gap-4'], 'gap'), cls).toBe('.gap-4')
    }
  })

  it('a caller utility beats a recipe layout keyword', async () => {
    const probe = { flat: {}, trees: { probe: { base: { display: 'grid', flexDirection: 'column', alignItems: 'center' } } } }
    const css = renderBaseCss(brand, probe, { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')
    const all = rules(await (await compile(`${css}\n@tailwind utilities;\n`)).build(['fui-probe', 'flex', 'flex-row', 'items-start']))
    expect(winner(all, ['.fui-probe'], 'flex-direction')).toBe('.fui-probe')
    expect(winner(all, ['.fui-probe', '.flex'], 'display')).toBe('.flex')
    expect(winner(all, ['.fui-probe', '.flex-row'], 'flex-direction')).toBe('.flex-row')
    expect(winner(all, ['.fui-probe', '.items-start'], 'align-items')).toBe('.items-start')
  })

  it('a passed border width and style survive the recipe’s border shorthand', async () => {
    const all = rules(await build(['fui-control', 'border-2', 'border-dashed']))
    const selectors = ['.fui-control', '.border-2', '.border-dashed']
    expect(winner(all, selectors, 'border-width')).toBe('.border-2')
    expect(winner(all, selectors, 'border-style')).toBe('.border-dashed')
    expect(winner(all, selectors, 'border-color')).toBe('.fui-control')
  })

  it('a passed size beats a stepped recipe at every width: the step sits inside the recipe’s own rule', async () => {
    const css = await build(['fui-swatch-sm', 'size-20'])
    const recipe = at(css, escape('fui-swatch-sm'))
    const step = css.indexOf('@container (width >= 28rem)', recipe)
    expect(step, 'the md step renders inside fui-swatch-sm').toBeGreaterThan(recipe)
    expect(at(css, escape('size-20'))).toBeGreaterThan(step)
  })

  it('beats a one-property recipe on its property', async () => {
    for (const [recipe, utility] of [
      ['fui-divider', 'bg-accent'],
      ['fui-track-fill', 'bg-accent'],
    ]) {
      const css = await build([recipe!, utility!])
      expect(at(css, escape(utility!)), `${utility} after ${recipe}`).toBeGreaterThan(at(css, escape(recipe!)))
    }
  })

  it.each([
    ['fui-button-md', 'h-4', 'height'],
    ['fui-badge', 'text-caption', 'font-size'],
    ['fui-input', 'h-12', 'height'],
  ])('%s loses to a passed %s', async (recipe, utility, property) => {
    const all = rules(await build([recipe, utility]))
    expect(winner(all, [escape(recipe), escape(utility)], property)).toBe(escape(utility))
  })

  it('a brand’s sidebar width is one value: the gap and container read it, an icon collapse beats it', async () => {
    const recipes = readRegistryRecipes(root)
    expect(recipes.trees['sidebar-size']!.base).toMatchObject({ width: '{spacing.64}' })
    const wide = { ...recipes, trees: { ...recipes.trees, 'sidebar-size': { ...recipes.trees['sidebar-size']!, base: { ...recipes.trees['sidebar-size']!.base, width: '{spacing.80}' } } } }
    const css = (await compile(`${renderBaseCss(brand, wide, { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')}\n@tailwind utilities;\n`)).build([
      'fui-sidebar-size',
      'fui-sidebar-container-icon',
    ])
    expect(css).toContain('--fui-sidebar-size-width: calc(var(--fui-spacing) * 80);')
    expect(css).toMatch(/\.fui-sidebar-size \{[^}]*width: var\(--fui-sidebar-size-width\);/)
    const all = rules(css)
    expect(winner(all, ['.fui-sidebar-size', '.fui-sidebar-container-icon'], 'width')).toBe('.fui-sidebar-container-icon')
  })

  it.each([['background-color'], ['box-shadow'], ['height']])('the sidebar input’s recipe beats the input it composes on %s', async (property) => {
    const all = rules(await build(['fui-input', 'fui-sidebar-input']))
    expect(winner(all, ['.fui-input', '.fui-sidebar-input'], property)).toBe('.fui-sidebar-input')
  })

  it.each([
    ['fui-button', 'fui-filter-reset', 'border-top-left-radius'],
    ['fui-popover-content', 'fui-filter-group-content', 'width'],
    ['fui-popover-content', 'fui-filter-group-content', 'padding'],
  ])('a filter recipe beats the item it composes: %s under %s on %s', async (composed, own, property) => {
    const all = rules(await build([composed, own]))
    expect(winner(all, [escape(composed), escape(own)], property)).toBe(escape(own))
  })

  it.each([
    ['fui-badge', 'fui-badge-neutral', 'color'],
    ['fui-badge', 'fui-badge-new', 'color'],
  ])('a component’s value beats its base: %s under %s on %s', async (base, value, property) => {
    const all = rules(await build([base, value]))
    expect(winner(all, [escape(base), escape(value)], property)).toBe(escape(value))
  })

  it('every pair in the registry’s recipes: its rule comes after both of its values, and a passed utility after it, on every property it sets', async () => {
    expect(pairs.map((pair) => pair.name)).toEqual(expect.arrayContaining(['button-solid-primary', 'badge-neutral-sm', 'sidebar-menu-button-lg-collapsed', 'range-calendar-cell-trigger-edge-today']))
    const utilities = [...new Set(Object.values(PASSED).flat())]
    const css = await build([...emitted, ...utilities])
    const problems: string[] = []
    let checked = 0
    for (const { name, classes, properties } of pairs) {
      // The pair's declarations read its variables; the copy that comes last decides against the values.
      const copies = [...css.matchAll(new RegExp(`var\\(--fui-${name}-[a-z-]+\\)`, 'g'))].map((m) => m.index)
      expect(copies.length, name).toBeGreaterThan(0)
      const last = Math.max(...copies)
      for (const cls of classes) if (!(css.indexOf(`${escape(cls)} {`) >= 0 || css.indexOf(`${escape(cls)}:where(`) >= 0)) problems.push(`${name}: ${cls} renders no rule`)
      for (const cls of classes) if (Math.max(css.indexOf(`${escape(cls)} {`), css.indexOf(`${escape(cls)}:where(`)) > last) problems.push(`${name}: ${cls} comes after the pair’s last copy`)
      for (const property of properties) {
        expect(PASSED[property], `${name} sets ${property}; add a passed utility for it`).toBeDefined()
        for (const utility of PASSED[property]!) {
          checked++
          if (at(css, escape(utility)) < last) problems.push(`${name} + ${utility}: the utility comes before the pair`)
        }
      }
    }
    expect(checked).toBeGreaterThan(40)
    expect(problems).toEqual([])
  })

  it('a pair beats both of its values on a property all three set: the small neutral badge has no padding', async () => {
    const css = await build(['fui-badge-neutral', 'fui-badge-sm', 'px-1'])
    const pair = Math.max(...[...css.matchAll(/var\(--fui-badge-neutral-sm-padding\)/g)].map((m) => m.index))
    for (const cls of ['fui-badge-neutral', 'fui-badge-sm']) expect(css.indexOf(`${escape(cls)} {`), cls).toBeLessThan(pair)
    expect(css).toMatch(/\.fui-badge-sm \{[\s\S]*?padding-inline: var\(--fui-badge-sm-padding-x\);[\s\S]*?&:where\(\.fui-badge-neutral\) \{\n\s*padding: var\(--fui-badge-neutral-sm-padding\);/)
    expect(at(css, '.px-1')).toBeGreaterThan(pair)
  })

  it('keeps a recipe’s own declarations: the sort key is not emitted', async () => {
    const css = await build(['fui-divider'])
    expect(css).toMatch(/\.fui-divider \{\n\s*background-color: [^;]+;\n\}/)
    expect(css).not.toContain('--tw-sort')
  })
})

describe('a class passed to a component reading a reka variable', () => {
  const PASSED_OVER_REKA: Record<string, string[]> = {
    'max-h': ['max-h-40', 'max-h-none'],
    'max-w': ['max-w-sm', 'max-w-none'],
    'min-w': ['min-w-56', 'min-w-0'],
    w: ['w-56', 'w-full', 'w-auto'],
    h: ['h-40', 'h-auto'],
    origin: ['origin-top', 'origin-center'],
    'translate-x': ['translate-x-0', 'translate-x-4'],
  }
  const reka = [
    ...new Set(
      readdirSync(join(root, 'ui'), { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.vue'))
        .flatMap((file) => [...readFileSync(join(root, 'ui', file), 'utf8').matchAll(/(?<![\w-])([a-z-]+)-\(--reka-[\w-]+\)/g)].map((m) => m[0])),
    ),
  ].sort()

  it('finds every converted class', () => {
    expect(reka).toEqual(expect.arrayContaining(['max-h-(--reka-select-content-available-height)', 'min-w-(--reka-select-trigger-width)', 'origin-(--reka-dropdown-menu-content-transform-origin)']))
    expect(reka.length).toBeGreaterThanOrEqual(15)
  })

  it('loses each property to a passed utility', async () => {
    const losses: string[] = []
    for (const cls of reka) {
      const utilities = PASSED_OVER_REKA[/^(.+)-\(/.exec(cls)![1]!]
      expect(utilities, `${cls}: add passed utilities for it`).toBeDefined()
      const all = rules(await build([cls, ...utilities!]))
      const [property] = all.find((r) => r.selector === escape(cls))!.decls[0]!
      for (const utility of utilities!) if (winner(all, [escape(cls), escape(utility)], property) !== escape(utility)) losses.push(`${cls} + ${utility}`)
    }
    expect(losses).toEqual([])
  })
})

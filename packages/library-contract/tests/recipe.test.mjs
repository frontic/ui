import { readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  designProblems,
  designWarnings,
  isTypedProperty,
  isColorProperty,
  isRecipeDefinition,
  parseRef,
  RECIPE_BLOCKS,
  RECIPE_PARTS,
  RECIPE_STATES,
  recipeNameProblem,
  recipeEntries,
  recipeProblems,
  recipeValueProblem,
  PROPERTY_GROUP,
  RING_PROPERTIES,
  STATE_RECIPES,
  textStepProblems,
  treeOwner,
  VALUE_KEYWORDS,
  VALUE_SETS,
  REFUSED_PROPERTIES,
  COLOR_PROPERTIES,
  REF_GROUPS,
  LAYOUT_KEYWORDS,
  REKA_POPUPS,
  treeProblems,
} from '../src/recipe.mjs'
import * as brand from '../src/brand.mjs'
import * as recipe from '../src/recipe.mjs'

const src = fileURLToPath(new URL('../src/', import.meta.url))
const IMPORT = /^\s*(?:import|export)\b[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm

/** Every specifier the module and the files it imports load, transitively. */
function importGraph(file, seen = new Set()) {
  const specifiers = []
  for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    const spec = match[1] ?? match[2] ?? match[3]
    specifiers.push(spec)
    if (!spec.startsWith('.')) continue
    const next = path.resolve(path.dirname(file), spec)
    if (seen.has(next)) continue
    seen.add(next)
    specifiers.push(...importGraph(next, seen))
  }
  return specifiers
}

describe('@frontic/library-contract/recipe', () => {
  it('loads no node: builtin anywhere in its import graph, so the stack’s client can import it', () => {
    const graph = importGraph(path.join(src, 'recipe.mjs'))
    expect(graph.filter((spec) => spec.startsWith('node:') || builtinModules.includes(spec))).toEqual([])
    expect(graph.filter((spec) => !spec.startsWith('.'))).toEqual([])
  })

  it('keeps node builtins on the brand side: the scan sees them in brand.mjs and not in recipe.mjs', () => {
    expect(importGraph(path.join(src, 'brand.mjs'))).toEqual(expect.arrayContaining(['node:fs', 'node:path']))
    expect(importGraph(path.join(src, 'recipe.mjs')).filter((spec) => spec.startsWith('node:'))).toEqual([])
  })

  it('exempts no colour group by name: neither module exports a list of groups the brand build skips', () => {
    expect('CHROME' in recipe).toBe(false)
    expect('CHROME' in brand).toBe(false)
  })

  it('is the package export ./recipe, and brand.mjs hands out the same tables and checks', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(pkg.exports['./recipe']).toEqual({ types: './src/recipe.d.mts', default: './src/recipe.mjs' })
    expect(brand.RECIPE_STATES).toBe(RECIPE_STATES)
    expect(brand.RECIPE_PARTS).toBe(RECIPE_PARTS)
    expect(brand.isRecipeDefinition).toBe(isRecipeDefinition)
    expect(brand.recipeValueProblem).toBe(recipeValueProblem)
    expect(RECIPE_BLOCKS).toEqual({ ...RECIPE_STATES, ...RECIPE_PARTS })
  })
})

describe('the property groups, their keywords and tree ownership', () => {
  it('names one token group per non-colour property; outline takes a ring token', () => {
    expect(PROPERTY_GROUP).toMatchObject({ typography: 'typography', border: 'border', borderTop: 'border', rounded: 'rounded', borderTopLeftRadius: 'rounded', shadow: 'shadow', outline: 'ring' })
    expect(Object.hasOwn(PROPERTY_GROUP, 'backgroundColor')).toBe(false)
  })

  it('names the keywords a colour and a shadow take besides a reference', () => {
    expect(VALUE_KEYWORDS).toEqual({ colors: ['transparent', 'currentColor'], shadow: ['none'], border: ['none'] })
  })

  it('gives a tree to the longest item name that is it or prefixes it', () => {
    expect(treeOwner('input-group-addon', ['input', 'input-group'])).toBe('input-group')
    expect(treeOwner('input', ['input', 'input-group'])).toBe('input')
    expect(treeOwner('chip', ['input'])).toBeUndefined()
  })
})

describe('parseRef', () => {
  it('reads a token reference as group and name, an alpha after /', () => {
    expect(parseRef('{colors.primary}')).toEqual({ group: 'colors', name: 'primary' })
    expect(parseRef(' {colors.ring/50} ')).toEqual({ group: 'colors', name: 'ring', alpha: '50' })
    expect(parseRef('{typography.ui}')).toEqual({ group: 'typography', name: 'ui' })
    expect(parseRef('{components.button.textColor}')).toEqual({ group: 'components', name: 'button.textColor' })
  })

  it('is null for a value that is no reference', () => {
    expect(parseRef('transparent')).toBeNull()
    expect(parseRef('1px solid')).toBeNull()
    expect(parseRef(4)).toBeNull()
  })

  it.each([
    ['{colors.primary /50}', /not a token reference/],
    ['{color.primary/50}', /\{color\.…\} is not a token group/],
    ['{spacing.2.3}', /not a spacing step/],
    ['{space.2}', /\{space\.…\} is not a token group/],
    ['{rounded.full/20}', /an alpha follows a \{colors\.…\} token only/],
    ['{colors.primary/05}', /whole percent from 0 to 100/],
    ['{colors.primary/50/2}', /whole percent from 0 to 100/],
    ['{colors.primary/}', /whole percent from 0 to 100/],
    ['{components.button}', /not a token reference/],
  ])('names the problem in %s', (value, problem) => {
    expect(parseRef(value)?.problem).toMatch(problem)
  })
})

describe('recipeValueProblem', () => {
  it('a keyword property takes its set only', () => {
    expect(recipeValueProblem('fontWeight', 'semibold')).toBeNull()
    expect(recipeValueProblem('fontWeight', 600)).toBe('600 — fontWeight takes normal, medium, semibold, bold')
    expect(recipeValueProblem('lineHeight', 'tight')).toBeNull()
    expect(recipeValueProblem('lineHeight', '1.43')).toBe('1.43 — lineHeight takes none, tight, snug, normal, relaxed, loose')
    expect(recipeValueProblem('letterSpacing', 'wide')).toBeNull()
    expect(recipeValueProblem('letterSpacing', '0.025em')).toBe('0.025em — letterSpacing takes tighter, tight, normal, wide, wider, widest')
    expect(recipeValueProblem('textDecorationLine', 'line-through')).toBeNull()
    expect(recipeValueProblem('textDecorationLine', 'overline')).toBe('overline — textDecorationLine takes none, underline, line-through')
    expect(recipeValueProblem('visibility', 'collapse')).toBeNull()
    expect(recipeValueProblem('visibility', 'inherit')).toBe('inherit — visibility takes visible, hidden, collapse')
  })

  it('a property that left the recipe is refused with where its value lives', () => {
    expect(recipeValueProblem('fontSize', '0.875rem')).toBe('fontSize — a size comes from a text style: typography: {typography.<name>}')
    expect(recipeValueProblem('borderWidth', '1px')).toBe('borderWidth — width and style live in the border token: border: {border.<name>}')
    expect(recipeValueProblem('borderStyle', 'solid')).toBe('borderStyle — width and style live in the border token: border: {border.<name>}')
    expect(recipeValueProblem('outlineWidth', '2px')).toBe('outlineWidth — width, style and offset live in the ring token: outline: {ring.<name>}')
    expect(recipeValueProblem('outlineStyle', 'solid')).toBe('outlineStyle — width, style and offset live in the ring token: outline: {ring.<name>}')
    expect(recipeValueProblem('outlineOffset', '2px')).toBe('outlineOffset — width, style and offset live in the ring token: outline: {ring.<name>}')
    expect(recipeValueProblem('textUnderlineOffset', '3px')).toBe('textUnderlineOffset — not a recipe property; a text style may carry it later')
    expect(recipeValueProblem('corner', 'round')).toBe('corner — not a recipe property')
  })

  it('a grouped property takes a token of its group or its keywords', () => {
    expect(recipeValueProblem('border', 'none')).toBeNull()
    expect(recipeValueProblem('border', '{border.default}')).toBeNull()
    expect(recipeValueProblem('border', '1px solid red')).toBe('1px solid red — border takes {border.<name>} or none')
    expect(recipeValueProblem('shadow', '0 1px 2px black')).toBe('0 1px 2px black — shadow takes {shadow.<name>} or none')
    expect(recipeValueProblem('rounded', '4px')).toBe('4px — rounded takes {rounded.<name>}')
    expect(recipeValueProblem('typography', 'Inter')).toBe('Inter — typography takes {typography.<name>}')
    expect(recipeValueProblem('backgroundColor', 'red')).toBe('red — backgroundColor takes {colors.<name>}, {colors.<name>/<NN>}, transparent or currentColor')
    expect(recipeValueProblem('backgroundColor', 'transparent')).toBeNull()
  })

  it('outline takes a ring token and renders the outline and its offset', () => {
    expect(recipeValueProblem('outline', '{ring.hairline}')).toBeNull()
    expect(recipeValueProblem('outline', '2px solid red')).toBe('2px solid red — outline takes {ring.<name>}')
    expect(recipeValueProblem('backgroundColor', '{ring.hairline}')).toBe('{ring.hairline} — a ring token sets outline only')
    const [entry] = recipeEntries({ flat: { panel: { outline: '{ring.hairline}' } } })
    expect(entry.vars).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ suffix: 'outline', declaration: 'var(--fui-ring-hairline)', properties: ['outline'] }),
        expect.objectContaining({ suffix: 'outline-offset', declaration: 'var(--fui-ring-hairline-offset)', properties: ['outline-offset'] }),
      ]),
    )
  })

  it('opacity takes an opacity token only', () => {
    expect(recipeValueProblem('opacity', '{opacity.60}')).toBeNull()
    expect(recipeValueProblem('opacity', '0.6')).toBe('0.6 — opacity takes {opacity.<name>}')
    expect(recipeValueProblem('textColor', '{opacity.60}')).toBe('{opacity.60} — an opacity token sets opacity only')
    const [entry] = recipeEntries({ flat: { muted: { opacity: '{opacity.0}' } } })
    expect(entry.vars).toContainEqual(expect.objectContaining({ suffix: 'opacity', declaration: 'var(--fui-opacity-0)' }))
  })

  it('translate takes one or two spacing axes', () => {
    expect(recipeValueProblem('translate', '{spacing.px}')).toBeNull()
    expect(recipeValueProblem('translate', '0 -{spacing.1}')).toBeNull()
    expect(recipeValueProblem('translate', 'full')).toBeNull()
    expect(recipeValueProblem('translate', 'calc(100% + 2px)')).toBe('calc(100% + 2px) — translate takes one or two axes: {spacing.<n>}, -{spacing.<n>}, 0, full, -full')
    expect(recipeValueProblem('translate', '1px')).toBe('1px — translate takes one or two axes: {spacing.<n>}, -{spacing.<n>}, 0, full, -full')
    expect(recipeValueProblem('translate', '0 0 0')).toBe('0 0 0 — translate takes one or two axes: {spacing.<n>}, -{spacing.<n>}, 0, full, -full')
    const [entry] = recipeEntries({ flat: { chevron: { translate: '0 -{spacing.px}' } } })
    expect(entry.vars).toContainEqual(expect.objectContaining({ suffix: 'translate', declaration: '0 calc(-1 * 1px)' }))
    const [full] = recipeEntries({ flat: { slide: { translate: '-full {spacing.2}' } } })
    expect(full.vars).toContainEqual(expect.objectContaining({ suffix: 'translate', declaration: '-100% calc(var(--fui-spacing) * 2)' }))
  })

  it('stroke and fill are colours that also take none', () => {
    expect(recipeValueProblem('fill', 'none')).toBeNull()
    expect(recipeValueProblem('stroke', 'currentColor')).toBeNull()
    expect(recipeValueProblem('fill', '{colors.primary/50}')).toBeNull()
    expect(recipeValueProblem('fill', 'red')).toBe('red — fill takes {colors.<name>}, {colors.<name>/<NN>}, transparent, currentColor or none')
    expect(recipeValueProblem('color', 'none')).toBe('none — color takes {colors.<name>}, {colors.<name>/<NN>}, transparent or currentColor')
  })

  it('text alignment and transform take keywords', () => {
    expect(recipeValueProblem('textAlign', 'start')).toBeNull()
    expect(recipeValueProblem('textAlign', 'middle')).toBe('middle — textAlign takes left, center, right, start, end, justify')
    expect(recipeValueProblem('textTransform', 'uppercase')).toBeNull()
    expect(recipeValueProblem('textTransform', 'small-caps')).toBe('small-caps — textTransform takes none, uppercase, lowercase, capitalize')
  })

  it('a keyword renders its mapped value', () => {
    const [entry] = recipeEntries({ flat: { kbd: { fontWeight: 'semibold', lineHeight: 'tight', letterSpacing: 'wide' } } })
    const declarations = Object.fromEntries(entry.vars.map((v) => [v.suffix, v.declaration]))
    expect(declarations).toMatchObject({ 'font-weight': '600', 'line-height': '1.25', 'letter-spacing': '0.025em' })
    const [normal] = recipeEntries({ flat: { kbd: { letterSpacing: 'normal' } } })
    expect(normal.vars).toContainEqual(expect.objectContaining({ suffix: 'letter-spacing', declaration: '0em' }))
  })

  it('refuses a reference the brand build would drop, with the reason', () => {
    expect(recipeValueProblem('backgroundColor', '{colors.primary /50}')).toMatch(/^\{colors\.primary \/50\} — not a token reference/)
    expect(recipeValueProblem('backgroundColor', '{color.primary/50}')).toMatch(/is not a token group/)
    expect(recipeValueProblem('textColor', '{typography.ui}')).toMatch(/a text style expands on typography only/)
    expect(recipeValueProblem('fontFamily', 'calc({x})')).toMatch(/cannot sit in a value/)
    expect(recipeValueProblem('fontFamily', '1px;}')).toMatch(/cannot sit in a value/)
    expect(recipeValueProblem('fontFamily', '  ')).toMatch(/empty/)
  })

  // The contract does not know the brand, so a well-formed reference to a colour the brand lacks passes here.
  it('passes an unknown colour: the registry gate, which knows the brand, refuses it', () => {
    expect(recipeValueProblem('backgroundColor', '{colors.nope/50}')).toBeNull()
    expect(recipeValueProblem('backgroundColor', '{colors.nope}')).toBeNull()
  })

  it('refuses a reference to another token group on a grouped or colour property', () => {
    expect(recipeValueProblem('outline', '{colors.ring}')).toBe('{colors.ring} — outline takes {ring.<name>}')
    expect(recipeValueProblem('opacity', '{colors.ring}')).toBe('{colors.ring} — opacity takes {opacity.<name>}')
    expect(recipeValueProblem('typography', '{colors.ring}')).toBe('{colors.ring} — typography takes {typography.<name>}')
    expect(recipeValueProblem('rounded', '{shadow.sm}')).toBe('{shadow.sm} — rounded takes {rounded.<name>}')
    expect(recipeValueProblem('border', '{colors.primary}')).toBe('{colors.primary} — border takes {border.<name>}')
    expect(recipeValueProblem('shadow', '{rounded.md}')).toBe('{rounded.md} — shadow takes {shadow.<name>}')
    expect(recipeValueProblem('backgroundColor', '{rounded.md}')).toBe('{rounded.md} — backgroundColor takes {colors.<name>}')
    expect(recipeValueProblem('borderTop', '{border.default}')).toBeNull()
    expect(recipeValueProblem('borderStart', '{border.default}')).toBeNull()
    expect(recipeValueProblem('borderEnd', '{spacing.2}')).not.toBeNull()
  })
})

describe('recipeProblems', () => {
  const messages = (def) => recipeProblems(def).map(({ path: at, message }) => `${at}: ${message}`)

  it('takes DESIGN.md’s own shapes: properties, state blocks, a file part', () => {
    expect(recipeProblems({ rounded: '{rounded.md}', file: { backgroundColor: 'transparent', typography: '{typography.ui}' }, hover: { iconColor: '{colors.ring/50}' } })).toEqual([])
  })

  it('takes an after part, the element’s ::after, with plain properties and no state inside it', () => {
    expect(RECIPE_PARTS.after).toBe('&::after')
    expect(recipeProblems({ after: { border: '{border.default}', rounded: '{rounded.full}' } })).toEqual([])
    expect(messages({ after: { hover: { opacity: '{opacity.100}' } } })).toEqual(['after.hover: a state inside a part'])
    expect(messages({ after: { iconColor: '{colors.primary}' } })).toEqual(['after.iconColor: styles an element inside; the after part has none'])
  })

  it.each(['iconColor', 'placeholderColor'])('refuses %s inside the file part: it styles an element a pseudo-element cannot hold', (prop) => {
    expect(messages({ file: { [prop]: '{colors.primary}' } })).toEqual([`file.${prop}: styles an element inside; the file part has none`])
    expect(isRecipeDefinition({ file: { [prop]: '{colors.primary}' } })).toBe(false)
  })

  it.each([
    ['fileColor', 'file'],
    ['hoverColor', 'hover'],
    ['checkedIconColor', 'checked'],
  ])('refuses a flat %s: its variable collides with the %s block’s', (prop, block) => {
    expect(messages({ [prop]: '{colors.primary}', [block]: { color: '{colors.primary}' } })).toEqual([`${prop}: its variable collides with the ${block} block’s; set it inside ${block}`])
    expect(isRecipeDefinition({ [prop]: '{colors.primary}' })).toBe(false)
  })

  it('reports every problem with its path, never a throw', () => {
    expect(messages({ hover: 'x', file: {}, today: { opacity: '{opacity.100}' }, checked: { open: { opacity: '{opacity.100}' } }, 'pad ding': '1px', opacity: 'x'.repeat(501) })).toEqual([
      'hover: a state is a block of one or more properties',
      'file: a part is a block of one or more properties',
      'today: must be a string of 1 to 500 characters or a number',
      'checked.open: a state inside a state',
      'pad ding: not a recipe property the library accepts',
      'opacity: must be a string of 1 to 500 characters or a number',
    ])
    expect(messages({})).toEqual([])
    expect(messages([])).toEqual([': a recipe is a block of one or more properties'])
    expect(recipeProblems({}, 'control')).toEqual([{ path: '', message: 'a recipe is a block of one or more properties' }])
    expect(messages(4)).toEqual([': a recipe is a block of one or more properties'])
    expect(messages('x')).toEqual([': a value is a block; write extends: x inside it'])
    expect(messages(['x', 'y'])).toEqual([': a value is a block; write extends: [x, y] inside it'])
    expect(messages({ extends: '@x' })).toEqual(['extends: names a family, or a list of them'])
  })
})

describe('the focus ring colour properties', () => {
  it('take a colour, an alpha too, at the top level of a value recipe', () => {
    expect(recipeProblems({ ringColor: '{colors.destructive/20}', ringBorderColor: '{colors.destructive/40}' })).toEqual([])
    expect(isColorProperty('ringColor')).toBe(true)
    expect(RING_PROPERTIES).toEqual({ ringColor: '--fui-ring-color', ringBorderColor: '--fui-ring-border-color' })
  })

  it.each(['focus-ring', 'disabled', 'invalid'])('are refused on the shared state recipe %s: a value recipe sets them', (name) => {
    expect(STATE_RECIPES).toEqual(['focus-ring', 'disabled', 'invalid'])
    expect(recipeProblems({ ringColor: '{colors.destructive}', ringBorderColor: '{colors.destructive}' }, name)).toEqual(
      ['ringColor', 'ringBorderColor'].map((prop) => ({ path: prop, message: 'colours the focus ring; a component’s own value sets it, never a family or a shared state recipe' })),
    )
    expect(recipeProblems({ ringColor: '{colors.destructive}' })).toEqual([])
  })

  it.each(['hover', 'focus', 'file'])('are refused inside %s: they set the ring on the element itself', (block) => {
    expect(recipeProblems({ [block]: { ringColor: '{colors.destructive}' } })).toEqual([
      { path: `${block}.ringColor`, message: 'sets the focus ring’s colour on the element; it sits at the top level' },
    ])
  })
})

describe('recipeNameProblem', () => {
  it.each(['button-hover', 'choice-checked', 'input-file'])('refuses %s: a state or part lives inside the value recipe', (name) => {
    expect(recipeNameProblem(name)).toMatch(/inside the value recipe/)
  })

  it('takes a lowercase name and refuses any other', () => {
    expect(recipeNameProblem('control-line')).toBeNull()
    expect(recipeNameProblem('Badge')).toMatch(/not a recipe name/)
  })
})

describe('textStepProblems', () => {
  const style = (steps) => ({ $value: { fontSize: { value: 1, unit: 'rem' }, lineHeight: 1.5 }, $extensions: { 'com.frontic.brand': { steps } } })
  const group = (steps) => ({ $type: 'typography', display: style(steps) })

  it('takes a md step of a dimension and a line height', () => {
    expect(textStepProblems(group({ md: { fontSize: { value: 0.875, unit: 'rem' }, lineHeight: 1.43 } }))).toEqual([])
    expect(textStepProblems(group(undefined))).toEqual([])
    expect(textStepProblems(undefined)).toEqual([])
  })

  it.each([
    [{ md: 'oops' }, 'text style display: steps.md is { fontSize, lineHeight }'],
    ['oops', 'text style display: steps maps a breakpoint to { fontSize, lineHeight }'],
    [{ lg: { lineHeight: 1 } }, 'text style display: a step at lg; only md steps, at the brand’s md breakpoint'],
    [{ md: { fontSize: {} } }, 'text style display: steps.md.fontSize is a dimension, as { value, unit: px | rem }'],
    [{ md: { fontSize: 'x;}' } }, 'text style display: steps.md.fontSize is a dimension, as { value, unit: px | rem }'],
    [{ md: { lineHeight: 'x;}' } }, 'text style display: steps.md.lineHeight is a number or a CSS length'],
    [{ md: { fontWeight: 600 } }, 'text style display: steps.md.fontWeight is not a step property; a step sets fontSize and lineHeight'],
    [{ md: {} }, 'text style display: steps.md sets fontSize, lineHeight or both'],
  ])('refuses %j as a reported problem', (steps, problem) => {
    expect(textStepProblems(group(steps))).toEqual([problem])
  })
})

describe('VALUE_SETS', () => {
  it('is frozen and names the keyword properties', () => {
    expect(Object.keys(VALUE_SETS)).toEqual([
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'textDecorationLine',
      'visibility',
      'textAlign',
      'textTransform',
      'display',
      'flexDirection',
      'flexWrap',
      'alignItems',
      'alignSelf',
      'alignContent',
      'justifyContent',
      'justifyItems',
      'justifySelf',
      'placeItems',
      'placeContent',
      'flex',
      'flexGrow',
      'flexShrink',
      'gridColumns',
      'gridRows',
      'gridColumn',
      'gridRow',
    ])
    expect(Object.isFrozen(VALUE_SETS)).toBe(true)
    expect(Object.isFrozen(VALUE_SETS.fontWeight)).toBe(true)
  })
})

describe('the tables the stack reads', () => {
  it('are frozen exports', () => {
    expect(Object.isFrozen(REFUSED_PROPERTIES)).toBe(true)
    expect(COLOR_PROPERTIES).toEqual(['color', 'background', 'fill', 'stroke'])
    expect(Object.isFrozen(COLOR_PROPERTIES)).toBe(true)
    expect(REF_GROUPS).toContain('border')
    expect(Object.isFrozen(REF_GROUPS)).toBe(true)
  })
})

describe('designProblems', () => {
  it('names every recipe problem in a components block as <path>: <reason>, flat recipes, trees and the set', () => {
    const recipes = {
      flat: { disabled: { opacity: '0.5' }, 'focus-ring': { outline: '{ring.focus}' } },
      trees: { badge: { base: { fontSize: '14px', outline: '{colors.ring}' }, variants: {}, defaults: {} } },
    }
    expect(designProblems(recipes)).toEqual([
      'disabled.opacity: 0.5 — opacity takes {opacity.<name>}',
      'badge.base.fontSize: fontSize — a size comes from a text style: typography: {typography.<name>}',
      'badge.base.outline: {colors.ring} — outline takes {ring.<name>}',
    ])
  })
  it('is empty for a block that renders whole, and for none', () => {
    expect(designProblems({ flat: { disabled: { opacity: '{opacity.50}' } }, trees: {} })).toEqual([])
    expect(designProblems({})).toEqual([])
  })
})

describe('contrast properties', () => {
  it('takes decorative: true and ground as a colour token, both typed', () => {
    expect(isTypedProperty('decorative')).toBe(true)
    expect(isTypedProperty('ground')).toBe(true)
    expect(recipeValueProblem('ground', '{colors.foreground}')).toBeNull()
    expect(recipeValueProblem('ground', '{spacing.2}')).toBe('{spacing.2} — ground takes {colors.<name>}')
    expect(recipeValueProblem('ground', '#000000')).toBe('#000000 — ground takes {colors.<name>}')
    expect(recipeValueProblem('ground', '{colors.foreground/50}')).toBe('{colors.foreground/50} — ground takes {colors.<name>}')
  })
  it('refuses decorative as anything but true, and either inside a state', () => {
    expect(recipeProblems({ textColor: '{colors.muted-foreground}', decorative: true }, 'x')).toEqual([])
    expect(recipeProblems({ decorative: 'yes' }, 'x')).toEqual([{ path: 'decorative', message: 'decorative is true or left out' }])
    expect(recipeProblems({ hover: { ground: '{colors.foreground}' } }, 'x')).toEqual([{ path: 'hover.ground', message: 'ground sits at the top level of a recipe or a value' }])
    expect(designProblems({ trees: { b: { base: {}, variants: { color: { inverse: { ground: '{colors.foreground}', textColor: '{colors.background}' } } } } } })).toEqual([])
  })
  it('warns about neither and renders neither', () => {
    expect(designWarnings({ flat: { x: { decorative: true, ground: '{colors.foreground}' } } })).toEqual([])
    const preset = JSON.parse(readFileSync(brand.stylePresetPath('default'), 'utf8'))
    const css = brand.renderBaseCss(preset, { flat: { x: { textColor: '{colors.foreground}', decorative: true, ground: '{colors.background}' } }, trees: {} })
    expect(css).toContain('--fui-x-text-color')
    expect(css).not.toMatch(/--fui-x-(?:decorative|ground)/)
  })
})

describe('typed or warned', () => {
  it('refuses the shorthands that bypass a typed property, naming the property that carries the value', () => {
    expect(recipeValueProblem('font', '30px/1 serif')).toBe('font — a shorthand of the text style: typography: {typography.<name>}, with fontWeight, lineHeight and letterSpacing keywords')
    expect(recipeValueProblem('transform', 'translate(40px)')).toBe('transform — a move comes from translate: {spacing.<n>}, one or two axes')
    expect(recipeValueProblem('textDecoration', 'underline 3px wavy red')).toBe('textDecoration — the line comes from textDecorationLine: none, underline, line-through')
    expect(recipeValueProblem('borderRadius', '4px')).toBe('borderRadius — a radius comes from rounded: {rounded.<name>}')
    expect(recipeValueProblem('boxShadow', '0 1px 2px black')).toBe('boxShadow — a shadow comes from shadow: {shadow.<name>}')
  })

  it('types a property a table covers, and no other', () => {
    for (const prop of ['fontWeight', 'typography', 'color', 'backgroundColor', 'outline', 'opacity', 'padding', 'translate', 'contain', 'visibility', 'textTransform', 'ringColor'])
      expect(isTypedProperty(prop), prop).toBe(true)
    for (const prop of ['fontFamily', 'cursor', 'whiteSpace', 'fontsize']) expect(isTypedProperty(prop), prop).toBe(false)
  })

  it('warns, without a problem, for each untyped property a components block sets, by path', () => {
    const recipes = {
      flat: { card: { cursor: 'pointer', hover: { fontFamily: 'serif' } } },
      trees: { badge: { base: { whiteSpace: 'nowrap', rounded: '{rounded.md}' }, variants: { size: { sm: { fontsize: '99px' } } }, defaults: { size: 'sm' } } },
    }
    expect(designWarnings(recipes)).toEqual([
      'card.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value',
      'card.hover.fontFamily: fontFamily is not a typed recipe property; it renders as written, with no check on its value',
      'badge.base.whiteSpace: whiteSpace is not a typed recipe property; it renders as written, with no check on its value',
      'badge.variants.size.sm.fontsize: fontsize is not a typed recipe property; it renders as written, with no check on its value',
    ])
    expect(designProblems(recipes)).toEqual([])
  })

  it('warns about nothing in a block of typed properties, and never about a refused one', () => {
    expect(designWarnings({ flat: { disabled: { opacity: '{opacity.50}' } }, trees: {} })).toEqual([])
    expect(designWarnings({ flat: { card: { font: '30px serif' } }, trees: {} })).toEqual([])
    expect(designWarnings({})).toEqual([])
  })
})

describe('the layout keywords', () => {
  it('take the values of the Tailwind utilities they replace', () => {
    expect(recipeValueProblem('display', 'inline-flex')).toBeNull()
    expect(recipeValueProblem('alignItems', 'center')).toBeNull()
    expect(recipeValueProblem('gridColumns', 3)).toBeNull()
    expect(recipeValueProblem('gridColumn', 'span 12')).toBeNull()
    expect(recipeValueProblem('gridColumns', 13)).toMatch(/^13 — gridColumns takes 1, 2/)
    expect(recipeValueProblem('flexDirection', '{spacing.2}')).toMatch(/flexDirection takes row/)
  })

  it('render the CSS of their utility', () => {
    expect([VALUE_SETS.justifySelf.start, VALUE_SETS.justifySelf.end, VALUE_SETS.justifyItems.start, VALUE_SETS.placeItems.start]).toEqual(['flex-start', 'flex-end', 'start', 'start'])
    expect([VALUE_SETS.alignItems.start, VALUE_SETS.justifyContent.between, VALUE_SETS.flex.initial, VALUE_SETS.gridColumns[3], VALUE_SETS.gridColumn['span 2'], VALUE_SETS.gridRow.full]).toEqual([
      'flex-start',
      'space-between',
      '0 auto',
      'repeat(3, minmax(0, 1fr))',
      'span 2 / span 2',
      '1 / -1',
    ])
  })
})

describe('the size and margin keywords', () => {
  it('take the keywords of the Tailwind utilities they replace', () => {
    for (const prop of ['width', 'minWidth', 'height', 'minHeight', 'size']) for (const keyword of ['full', 'fit', 'auto', 'max', 'min']) expect(recipeValueProblem(prop, keyword)).toBeNull()
    for (const keyword of ['full', 'fit', 'max', 'min']) expect(recipeValueProblem('maxWidth', keyword)).toBeNull()
    expect(recipeValueProblem('height', 'svh')).toBeNull()
    expect(recipeValueProblem('minHeight', 'svh')).toBeNull()
    for (const prop of ['margin', 'marginX', 'marginY', 'marginTop', 'marginBottom', 'marginStart', 'marginEnd']) expect(recipeValueProblem(prop, 'auto')).toBeNull()
  })

  it('refuses a keyword its utility does not have, naming the ones the property takes', () => {
    expect(recipeValueProblem('width', 'screen')).toBe(
      'screen — a layout property takes {spacing.<n>} or {container.<name>}; width also takes full, fit, auto, max, min, trigger, available or viewport',
    )
    expect(recipeValueProblem('maxWidth', 'auto')).toMatch(/^auto — .*; maxWidth also takes full, fit, max, min, trigger, available or viewport$/)
    expect(recipeValueProblem('width', 'svh')).toMatch(/^svh — /)
    expect(recipeValueProblem('marginTop', 'full')).toBe('full — a layout property takes {spacing.<n>}; marginTop also takes auto')
    expect(recipeValueProblem('bleedX', 'auto')).toBe('auto — a layout property takes {spacing.<n>}')
    expect(recipeValueProblem('padding', 'auto')).toBe('auto — a layout property takes {spacing.<n>}')
    expect(recipeValueProblem('size', 'trigger')).toMatch(/^trigger — .*; size also takes full, fit, auto, max or min$/)
  })

  it('render the CSS of their utility', () => {
    const tree = { base: { width: 'full', maxWidth: 'max', height: 'svh', minWidth: 'fit', size: 'min', marginX: 'auto', '@md': { width: 'auto' } }, variants: {}, defaults: {} }
    expect(treeProblems('probe', tree)).toEqual([])
    const vars = recipeEntries({ flat: {}, trees: { probe: tree } })[0].vars
    expect(vars.map(({ suffix, declaration }) => [suffix, declaration])).toEqual([
      ['width', '100%'],
      ['max-width', 'max-content'],
      ['height', '100svh'],
      ['min-width', 'fit-content'],
      ['size', 'min-content'],
      ['margin-x', 'auto'],
      ['md-width', 'auto'],
    ])
    expect(LAYOUT_KEYWORDS.width).toEqual({ full: '100%', fit: 'fit-content', auto: 'auto', max: 'max-content', min: 'min-content' })
    expect(Object.isFrozen(LAYOUT_KEYWORDS)).toBe(true)
  })
})

describe('the Reka popup keywords', () => {
  it('read the variable Reka sets on the popup the tree names, rendered on the element', () => {
    const trees = {
      'select-content': { base: { width: 'trigger' }, variants: {}, defaults: {} },
      'autocomplete-content': { base: { width: 'trigger', '@md': { maxWidth: 'available' } }, variants: {}, defaults: {} },
      'popover-content': { base: { maxWidth: 'available', minHeight: 'trigger' }, variants: {}, defaults: {} },
      'mega-menu-viewport': { base: { height: 'viewport', width: 'viewport' }, variants: {}, defaults: {} },
    }
    for (const [name, tree] of Object.entries(trees)) expect(treeProblems(name, tree)).toEqual([])
    const vars = Object.fromEntries(recipeEntries({ flat: {}, trees }).map(({ recipe, vars }) => [recipe, vars.map(({ suffix, declaration, local }) => [suffix, declaration, local])]))
    expect(vars).toEqual({
      'select-content': [['width', 'var(--reka-select-trigger-width)', true]],
      'autocomplete-content': [
        ['width', 'var(--reka-combobox-trigger-width)', true],
        ['md-max-width', 'var(--reka-combobox-content-available-width)', true],
      ],
      'popover-content': [
        ['max-width', 'var(--reka-popover-content-available-width)', true],
        ['min-height', 'var(--reka-popover-trigger-height)', true],
      ],
      'mega-menu-viewport': [
        ['height', 'var(--reka-navigation-menu-viewport-height)', true],
        ['width', 'var(--reka-navigation-menu-viewport-width)', true],
      ],
    })
    expect(REKA_POPUPS['dropdown-menu']).toBe('dropdown-menu')
    expect(Object.isFrozen(REKA_POPUPS)).toBe(true)
  })

  it('refuses one on a tree that is no popup’s, one its popup lacks, and one in a flat recipe or a parts block', () => {
    expect(treeProblems('card', { base: { width: 'trigger' }, variants: {}, defaults: {} })).toEqual([
      'card.base.width: trigger reads a variable Reka sets on a popup; card is no popup’s tree (select, combobox, autocomplete, dropdown-menu, context-menu, menubar, popover, hover-card, tooltip, navigation-menu, mega-menu)',
    ])
    expect(treeProblems('navigation-menu-viewport', { base: { width: 'trigger' }, variants: {}, defaults: {} })).toEqual([
      'navigation-menu-viewport.base.width: trigger reads a variable Reka sets on a popup; navigation-menu sets viewport only',
    ])
    expect(treeProblems('select-content', { base: {}, variants: { position: { popper: { '@md': { width: 'viewport' } } } }, defaults: {} })).toEqual([
      'select-content.variants.position.popper.@md.width: viewport reads a variable Reka sets on a popup; select sets trigger and available only',
    ])
    expect(recipeProblems({ width: 'trigger' }, 'popover')).toEqual([{ path: 'width', message: 'trigger reads a variable Reka sets on a popup; it sits in the popup’s own tree' }])
    expect(recipeProblems({ parts: { 'select-content': { width: 'trigger' } } })).toEqual([
      { path: 'parts.select-content.width', message: 'trigger reads a variable Reka sets on a popup; it sits in the popup’s own tree' },
    ])
  })
})

describe('a text alignment step', () => {
  it('steps at the container like the layout keywords, rendering inside its container query', () => {
    const tree = { base: { textAlign: 'center', '@sm': { textAlign: 'start' } }, variants: {}, defaults: {} }
    expect(treeProblems('probe', tree)).toEqual([])
    const vars = recipeEntries({ flat: {}, trees: { probe: tree } })[0].vars
    expect(vars.find((v) => v.media)).toEqual({ suffix: 'sm-text-align', declaration: 'start', media: '@sm', properties: ['text-align'] })
    expect(treeProblems('probe', { base: { '@sm': { textTransform: 'uppercase' } }, variants: {}, defaults: {} })).toEqual([
      'probe.base.@sm.textTransform: a step sets layout properties and textAlign only, from the component’s @sm container width',
    ])
  })
})

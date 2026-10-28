import { describe, expect, it } from 'vitest'
import {
  CONTAIN,
  CONTAIN_VALUES,
  flattenTree,
  isRecipeDefinition,
  LAYOUT_PARTS,
  LAYOUT_PROPERTIES,
  LAYOUT_STEPS,
  normalizeRecipe,
  parseRef,
  PARTS,
  parseExtends,
  recipeEntries,
  recipeProblems,
  recipeSetProblems,
  recipeValueProblem,
  splitRecipes,
  TREE_KEYS,
  treeEntries,
  treeProblems,
} from '../src/recipe.mjs'

const families = {
  'focus-ring': { outlineColor: '{colors.ring/50}' },
  disabled: { opacity: '{opacity.50}' },
  control: { border: '{border.default}', shadow: '{shadow.xs}', placeholderColor: '{colors.muted-foreground}' },
  action: { border: '{border.default}', borderColor: 'transparent', rounded: '{rounded.md}', typography: '{typography.ui}', hover: { opacity: '{opacity.90}' } },
  ringed: { ringColor: '{colors.destructive/20}' },
}

const button = {
  base: { extends: 'action' },
  variants: {
    variant: {
      'brand-primary': { backgroundColor: '{colors.primary}', hover: { backgroundColor: '{colors.primary/80}' }, with: { size: { lg: { paddingX: '{spacing.3}' } } } },
      'destructive-secondary': { backgroundColor: '{colors.destructive/10}', ringColor: '{colors.destructive/20}', ringBorderColor: '{colors.destructive/40}' },
    },
    size: {
      xs: { height: '{spacing.6}', paddingX: '{spacing.2}', gap: '{spacing.1}', typography: '{typography.caption}', icon: { size: '{spacing.3}' } },
      lg: { height: '{spacing.10}', paddingX: '{spacing.2.5}' },
    },
  },
  defaults: { variant: 'brand-primary', size: 'lg' },
}

describe('the tree vocabulary', () => {
  it('names the tree keys, the layout properties and the icon part', () => {
    expect(TREE_KEYS).toEqual(['base', 'variants', 'defaults', 'keepAxis'])
    expect(Object.keys(LAYOUT_PROPERTIES)).toEqual([
      'height',
      'minHeight',
      'width',
      'minWidth',
      'maxWidth',
      'size',
      'padding',
      'paddingX',
      'paddingY',
      'paddingTop',
      'paddingBottom',
      'paddingStart',
      'paddingEnd',
      'margin',
      'marginX',
      'marginY',
      'marginTop',
      'marginBottom',
      'marginStart',
      'marginEnd',
      'bleedX',
      'bleedY',
      'bleedTop',
      'bleedBottom',
      'bleedStart',
      'bleedEnd',
      'gap',
    ])
    expect(LAYOUT_PARTS.icon).toEqual({ selector: '& :where([data-icon])', properties: ['size'] })
  })

  it('splits components into flat recipes and component trees', () => {
    expect(splitRecipes({ control: families.control, button, input: { base: { height: '{spacing.9}' } } })).toEqual({
      flat: { control: families.control },
      trees: { button, input: { base: { height: '{spacing.9}' } } },
    })
  })
})

describe('parseExtends and normalizeRecipe', () => {
  it('read the extends key, a name or a list; a bare name is no value', () => {
    expect(normalizeRecipe('control')).toBeNull()
    expect(normalizeRecipe(['control', 'control-line'])).toBeNull()
    expect(normalizeRecipe({ extends: ['control', 'control-line'] })).toEqual({ extends: ['control', 'control-line'] })
    expect(parseExtends('control')).toEqual([])
    expect(normalizeRecipe({ extends: 'a', rounded: '{rounded.md}' })).toEqual({ extends: ['a'], rounded: '{rounded.md}' })
    expect(normalizeRecipe({ rounded: '{rounded.md}' })).toEqual({ rounded: '{rounded.md}' })
    expect(parseExtends({ extends: ['control', 'control-line'], height: '{spacing.9}' })).toEqual(['control', 'control-line'])
    expect(parseExtends({ height: '{spacing.9}' })).toEqual([])
  })

  it('accepts a value block as a recipe definition, never a bare name', () => {
    expect(isRecipeDefinition('control')).toBe(false)
    expect(isRecipeDefinition(['control'])).toBe(false)
    expect(isRecipeDefinition({ extends: ['control'], height: '{spacing.9}', icon: { size: '{spacing.4}' } })).toBe(true)
    expect(isRecipeDefinition({ extends: ['control'] })).toBe(true)
    expect(isRecipeDefinition({ extends: ['@control'] })).toBe(false)
    expect(isRecipeDefinition('@control')).toBe(false)
  })
})

describe('spacing steps', () => {
  it('read {spacing.<n>} in quarters and {spacing.px}', () => {
    expect(parseRef('{spacing.2.5}')).toEqual({ group: 'spacing', name: '2.5' })
    expect(parseRef('{spacing.px}')).toEqual({ group: 'spacing', name: 'px' })
    expect(parseRef('{spacing.96}')).toEqual({ group: 'spacing', name: '96' })
    expect(parseRef('{spacing.8.25}')).toEqual({ group: 'spacing', name: '8.25' })
  })

  it.each(['{spacing.2.3}', '{spacing.-1}', '{spacing.96.5}', '{spacing.base}', '{spacing.01}'])('refuses %s', (value) => {
    expect(parseRef(value).problem).toMatch(/not a spacing step/)
    expect(recipeValueProblem('height', value)).toMatch(/not a spacing step/)
  })

  it('set a layout property only, and a layout property takes nothing else', () => {
    expect(recipeValueProblem('height', '{spacing.9}')).toBeNull()
    expect(recipeValueProblem('textColor', '{spacing.1}')).toMatch(/a spacing step sets a layout property only/)
    expect(recipeValueProblem('height', '36px')).toMatch(/a layout property takes \{spacing\.<n>\}/)
    expect(recipeValueProblem('paddingX', '{rounded.md}')).toMatch(/a layout property takes \{spacing\.<n>\}/)
  })
})

describe('flattenTree', () => {
  it('emits one recipe per class the tree makes, every use inlined', () => {
    const flat = flattenTree('button', button, families)
    expect(Object.keys(flat)).toEqual(['button', 'button-brand-primary', 'button-destructive-secondary', 'button-xs', 'button-lg', 'button-brand-primary-lg'])
    expect(flat.button).toEqual(families.action)
    expect(flat['button-xs']).toEqual(button.variants.size.xs)
    expect(flat['button-brand-primary-lg']).toEqual({ paddingX: '{spacing.3}' })
  })

  it('names a value by its axis only where the tree asks: a value two axes share, or one its keepAxis lists', () => {
    const toggle = {
      base: {},
      variants: { variant: { default: {}, outline: { with: { size: { default: { height: '{spacing.8}' } } } } }, size: { default: {}, sm: {} } },
    }
    expect(Object.keys(flattenTree('toggle', toggle, families))).toEqual(['toggle', 'toggle-variant-default', 'toggle-outline', 'toggle-size-default', 'toggle-sm', 'toggle-outline-size-default'])
    const sidebar = { base: {}, variants: { variant: { inset: {}, floating: {} } }, keepAxis: ['inset'] }
    expect(Object.keys(flattenTree('sidebar', sidebar, { 'sidebar-inset': {} }))).toEqual(['sidebar', 'sidebar-variant-inset', 'sidebar-floating'])
    const { keepAxis: _, ...bare } = sidebar
    expect(Object.keys(flattenTree('sidebar', bare, { 'sidebar-inset': {} }))).toEqual(['sidebar', 'sidebar-inset', 'sidebar-floating'])
  })

  it('merges uses in order and the value’s own properties over them, block by block', () => {
    const tree = { base: { extends: ['control', 'action'], height: '{spacing.9}', hover: { textColor: '{colors.primary}' } } }
    expect(flattenTree('input', tree, families).input).toEqual({
      border: '{border.default}',
      shadow: '{shadow.xs}',
      placeholderColor: '{colors.muted-foreground}',
      borderColor: 'transparent',
      rounded: '{rounded.md}',
      typography: '{typography.ui}',
      hover: { opacity: '{opacity.90}', textColor: '{colors.primary}' },
      height: '{spacing.9}',
    })
  })
})

describe('a value that sets a property owns its steps', () => {
  const stepped = {
    'surface-inset': { paddingY: '{spacing.6}', gap: '{spacing.2}', '@md': { paddingY: '{spacing.8}' } },
    indent: { paddingStart: '{spacing.4}', '@md': { paddingStart: '{spacing.6}', gap: '{spacing.3}' } },
    roomy: { paddingY: '{spacing.5}' },
  }
  const base = (value) => flattenTree('card', { base: value }, stepped).card

  it('drops the family’s step value for a property the value sets, and the step block it empties, leaving the family as it was', () => {
    expect(base({ extends: 'surface-inset', paddingY: '{spacing.4}' })).toEqual({ gap: '{spacing.2}', paddingY: '{spacing.4}' })
    expect(stepped['surface-inset']['@md']).toEqual({ paddingY: '{spacing.8}' })
  })

  it('keeps the step value the value writes itself, and drops the family’s for another it sets', () => {
    expect(base({ extends: 'surface-inset', paddingY: '{spacing.4}', '@md': { paddingY: '{spacing.5}' } })).toEqual({
      gap: '{spacing.2}',
      paddingY: '{spacing.4}',
      '@md': { paddingY: '{spacing.5}' },
    })
    expect(base({ extends: 'indent', paddingStart: '{spacing.2}', gap: '{spacing.1}', '@md': { paddingStart: '{spacing.5}' } })).toEqual({
      paddingStart: '{spacing.2}',
      gap: '{spacing.1}',
      '@md': { paddingStart: '{spacing.5}' },
    })
  })

  it('keeps the family’s step values for the properties the value leaves alone', () => {
    expect(base({ extends: 'surface-inset', gap: '{spacing.1}' })).toEqual({ paddingY: '{spacing.6}', '@md': { paddingY: '{spacing.8}' }, gap: '{spacing.1}' })
    expect(base({ extends: 'indent', paddingStart: '{spacing.2}' })).toEqual({ '@md': { gap: '{spacing.3}' }, paddingStart: '{spacing.2}' })
    expect(stepped.indent['@md']).toEqual({ paddingStart: '{spacing.6}', gap: '{spacing.3}' })
  })

  it('lets a later family own what it sets at base over an earlier family’s step, and keeps a later family’s step over an earlier base', () => {
    expect(base({ extends: ['surface-inset', 'roomy'] })).toEqual({ gap: '{spacing.2}', paddingY: '{spacing.5}' })
    expect(base({ extends: ['roomy', 'surface-inset'] })).toEqual({ paddingY: '{spacing.6}', gap: '{spacing.2}', '@md': { paddingY: '{spacing.8}' } })
  })
})

describe('a value owns the CSS a property writes, not its name', () => {
  const sided = {
    sides: { '@md': { paddingY: '{spacing.8}', paddingStart: '{spacing.6}', paddingTop: '{spacing.7}', gap: '{spacing.3}' } },
    all: { '@md': { padding: '{spacing.8}', gap: '{spacing.3}' } },
    inline: { '@md': { paddingX: '{spacing.8}', paddingY: '{spacing.4}' } },
    bled: { '@md': { marginX: '{spacing.4}', marginTop: '{spacing.2}' } },
    arranged: { '@md': { flexGrow: '1', alignItems: 'center', width: 'full', textAlign: 'center' } },
  }
  const base = (value) => flattenTree('card', { base: value }, sided).card

  it('drops every side a shorthand covers, and keeps the rest', () => {
    expect(base({ extends: 'sides', padding: '{spacing.4}' })).toEqual({ '@md': { gap: '{spacing.3}' }, padding: '{spacing.4}' })
  })

  it('drops a shorthand step when the value sets one of its sides', () => {
    expect(base({ extends: 'all', paddingY: '{spacing.4}' })).toEqual({ '@md': { gap: '{spacing.3}' }, paddingY: '{spacing.4}' })
  })

  it('drops an overlapping side and keeps one that does not touch it', () => {
    expect(base({ extends: 'inline', paddingTop: '{spacing.2}' })).toEqual({ '@md': { paddingX: '{spacing.8}' }, paddingTop: '{spacing.2}' })
    expect(base({ extends: 'sides', paddingX: '{spacing.2}' })).toEqual({ '@md': { paddingY: '{spacing.8}', paddingTop: '{spacing.7}', gap: '{spacing.3}' }, paddingX: '{spacing.2}' })
  })

  it('reads a bleed as the margin it writes', () => {
    expect(base({ extends: 'bled', bleedX: '{spacing.4}' })).toEqual({ '@md': { marginTop: '{spacing.2}' }, bleedX: '{spacing.4}' })
  })

  it('reads an arrangement shorthand by the longhands it writes', () => {
    expect(base({ extends: 'arranged', flex: '1', placeItems: 'center', size: '{spacing.4}' })).toEqual({
      '@md': { textAlign: 'center' },
      flex: '1',
      placeItems: 'center',
      size: '{spacing.4}',
    })
  })

  it('applies between families in extends order', () => {
    const families = { ...sided, 'base-padding': { padding: '{spacing.2}' }, 'base-y': { paddingY: '{spacing.2}' } }
    const card = (use) => flattenTree('card', { base: { extends: use } }, families).card
    expect(card(['sides', 'base-padding'])).toEqual({ '@md': { gap: '{spacing.3}' }, padding: '{spacing.2}' })
    expect(card(['base-y', 'all'])).toEqual({ paddingY: '{spacing.2}', '@md': { padding: '{spacing.8}', gap: '{spacing.3}' } })
  })
})

describe('treeProblems', () => {
  const problems = (tree) => treeProblems('button', tree, families)

  it('takes a well-formed tree', () => {
    expect(problems(button)).toEqual([])
    expect(problems({ base: { extends: ['control'], height: '{spacing.9}', paddingX: '{spacing.2.5}' }, variants: {}, defaults: {} })).toEqual([])
  })

  it.each([
    [{ ...button, slots: {} }, 'button.slots: not a tree key; a component tree holds base, variants, defaults and keepAxis'],
    [{ base: { extends: 'action' }, backgroundColor: '{colors.primary}' }, 'button.backgroundColor: not a tree key; a component tree holds base, variants, defaults and keepAxis'],
    [{ variants: { variant: 'action' } }, 'button.variants.variant: an axis is an object of values'],
    [{ variants: { size: { lg: {} } }, keepAxis: 'lg' }, 'button.keepAxis: a list of values whose class keeps its axis'],
    [{ variants: { size: { lg: {} } }, keepAxis: ['xl'] }, 'button.keepAxis: xl names no value of variants'],
    [{ variants: { variant: { a: { extends: 'action' } } }, defaults: { variant: 'b' } }, 'button.defaults.variant: names no value of variants.variant'],
    [{ variants: { variant: { a: { extends: 'action' } } }, defaults: { tone: 'a' } }, 'button.defaults.tone: names no value of variants.tone'],
    [{ variants: { variant: { a: { with: { tone: { a: { gap: '{spacing.1}' } } } } } } }, 'button.variants.variant.a.with.tone: names no axis of variants'],
    [{ variants: { variant: { a: { with: { variant: { b: { gap: '{spacing.1}' } } } } } } }, 'button.variants.variant.a.with.variant: a with block names another axis, never the value’s own'],
    [{ variants: { variant: { a: { with: { size: { b: { gap: '{spacing.1}' } } } } }, size: { s: {} } } }, 'button.variants.variant.a.with.size.b: names no value of variants.size'],
    [
      { variants: { variant: { a: { with: { size: { s: { with: { variant: { a: { gap: '{spacing.1}' } } } } } } } }, size: { s: {} } } },
      'button.variants.variant.a.with.size.s.with.variant: a with block names another axis, never one already on its path',
    ],
    [{ variants: { variant: { a: { with: [] } } } }, 'button.variants.variant.a.with: maps another axis to the values the pair takes'],
    [{ variants: { variant: { a: { extends: 'action' } } }, compounds: [{ when: { variant: 'a' }, gap: '{spacing.1}' }] }, 'button.compounds: compounds moved under their first value as with'],
    [{ base: { extends: 'nope' } }, 'button.base.extends: nope is not a flat recipe'],
    [{ base: { extends: 'button' } }, 'button.base.extends: button is not a flat recipe'],
    [{ base: 'action' }, 'button.base: a value is a block; write extends: action inside it'],
    [{ base: ['action', 'control'] }, 'button.base: a value is a block; write extends: [action, control] inside it'],
    [{ variants: { variant: { a: 'action' } } }, 'button.variants.variant.a: a value is a block; write extends: action inside it'],
    [{ variants: { variant: { a: { with: { size: { s: 'action' } } } }, size: { s: {} } } }, 'button.variants.variant.a.with.size.s: a value is a block; write extends: action inside it'],
    [{ base: 12 }, 'button.base: a value is a block of properties, with the families it extends'],
    [{ base: { extends: '@action' } }, 'button.base.extends: names a family, or a list of them, not @action'],
    [{ base: { use: 'action' } }, 'button.base.use: use moved to extends, the family by name'],
    [{ base: { hover: { use: 'action' } } }, 'button.base.hover.use: use moved to extends, the family by name'],
    [{ base: { hover: { height: '{spacing.9}' } } }, 'button.base.hover.height: a layout property sits at the top level or in the icon part'],
    [{ base: { icon: { textColor: '{colors.primary}' } } }, 'button.base.icon.textColor: the icon part takes size only'],
    [{ base: { height: '{spacing.2.3}' } }, 'button.base.height: {spacing.2.3} — not a spacing step: {spacing.<n>}, <n> from 0 to 96 in quarters, or {spacing.px}'],
    [{ base: { extends: 'ringed' } }, 'button.base.extends: ringed colours the focus ring; a component’s own value sets it, never a family'],
    [{ base: { extends: 'focus-ring' } }, 'button.base.extends: focus-ring is a shared state; a component applies it behind its variant'],
  ])('refuses %j', (tree, problem) => {
    expect(problems(tree)).toContain(problem)
  })

  it('takes a layout step at a container width on a base, a value or a with block; a step holds layout only', () => {
    expect(problems({ base: { gap: '{spacing.3}', '@md': { gap: '{spacing.2}' } }, variants: { size: { sm: { size: '{spacing.12}', '@lg': { size: '{spacing.9}' } } } } })).toEqual([])
    expect(problems({ variants: { size: { sm: { size: '{spacing.12}', '@md': { backgroundColor: '{colors.primary}' } } } } })).toEqual([
      'button.variants.size.sm.@md.backgroundColor: a step sets layout properties and textAlign only, from the component’s @md container width',
    ])
    expect(problems({ base: { '@md': {} } })).toEqual(['button.base.@md: a step is a block of one or more layout properties'])
    expect(problems({ base: { '@sm': { size: '{spacing.2.3}' } } })).toEqual(['button.base.@sm.size: {spacing.2.3} — not a spacing step: {spacing.<n>}, <n> from 0 to 96 in quarters, or {spacing.px}'])
    expect(isRecipeDefinition({ size: '{spacing.12}', '@md': { size: '{spacing.9}' } })).toBe(true)
    expect(LAYOUT_STEPS).toEqual(['@sm', '@md', '@lg'])
  })

  it('steps layout at a container width', () => {
    const tree = { base: { gap: '{spacing.2}', '@md': { gap: '{spacing.4}' } }, variants: {}, defaults: {} }
    expect(treeProblems('swatch-group', tree)).toEqual([])
    const entries = recipeEntries({ flat: {}, trees: { 'swatch-group': tree } })
    expect(entries[0].vars.find((v) => v.media)).toMatchObject({ suffix: 'md-gap', media: '@md', properties: ['gap'] })
  })

  it('refuses the viewport md step with the container form', () => {
    expect(treeProblems('x', { base: { md: { gap: '{spacing.4}' } }, variants: {}, defaults: {} })).toEqual([
      "x.base.md: a step is written '@md' and widens at the component’s container; md stepped at the viewport",
    ])
    expect(recipeProblems({ md: { gap: '{spacing.4}' } })).toEqual([{ path: 'md', message: "a step is written '@md' and widens at the component’s container; md stepped at the viewport" }])
  })

  it('margins and bleeds are layout', () => {
    const tree = { base: { marginTop: '{spacing.1}', bleedX: '{spacing.4}', '@md': { bleedY: '{spacing.px}' } }, variants: {}, defaults: {} }
    expect(treeProblems('x', tree)).toEqual([])
    const vars = recipeEntries({ flat: {}, trees: { x: tree } })[0].vars
    expect(vars).toContainEqual(expect.objectContaining({ suffix: 'margin-top', declaration: 'calc(var(--fui-spacing) * 1)', properties: ['margin-top'] }))
    expect(vars).toContainEqual(expect.objectContaining({ suffix: 'bleed-x', declaration: 'calc(-1 * calc(var(--fui-spacing) * 4))', properties: ['margin-inline'] }))
    expect(vars).toContainEqual(expect.objectContaining({ suffix: 'md-bleed-y', declaration: 'calc(-1 * 1px)', media: '@md', properties: ['margin-block'] }))
    expect(Object.keys(LAYOUT_PROPERTIES)).toEqual(expect.arrayContaining(['margin', 'marginX', 'marginY', 'marginTop', 'marginBottom', 'marginStart', 'marginEnd', 'bleedX', 'bleedY']))
    expect(LAYOUT_PROPERTIES.marginX).toEqual(['margin-inline'])
    expect(LAYOUT_PROPERTIES.marginStart).toEqual(['margin-inline-start'])
    expect(recipeValueProblem('bleedX', '{rounded.md}')).toMatch(/a layout property takes \{spacing\.<n>\}/)
  })

  it.each([
    ['bleedTop', 'bleed-top', 'margin-top'],
    ['bleedBottom', 'bleed-bottom', 'margin-bottom'],
    ['bleedStart', 'bleed-start', 'margin-inline-start'],
    ['bleedEnd', 'bleed-end', 'margin-inline-end'],
  ])('%s negates one side', (prop, suffix, property) => {
    const tree = { base: { [prop]: '{spacing.2}' }, variants: {}, defaults: {} }
    expect(treeProblems('x', tree)).toEqual([])
    expect(LAYOUT_PROPERTIES[prop]).toEqual([property])
    const vars = recipeEntries({ flat: {}, trees: { x: tree } })[0].vars
    expect(vars).toContainEqual(expect.objectContaining({ suffix, declaration: 'calc(-1 * calc(var(--fui-spacing) * 2))', properties: [property] }))
  })

  it('contain sits on a base, inline-size only', () => {
    expect(treeProblems('x', { base: { contain: 'inline-size' }, variants: {}, defaults: {} })).toEqual([])
    expect(treeProblems('x', { base: { contain: 'size' }, variants: {}, defaults: {} })).toEqual(['x.base.contain: contain is inline-size'])
    expect(treeProblems('x', { base: {}, variants: { v: { a: { contain: 'inline-size' } } }, defaults: {} })).toEqual(['x.variants.v.a.contain: contain sits on a base'])
    expect(treeProblems('x', { base: {}, variants: { v: { a: { with: { w: { b: { contain: 'inline-size' } } } } }, w: { b: {} } }, defaults: {} })).toEqual([
      'x.variants.v.a.with.w.b.contain: contain sits on a base',
    ])
    expect(treeProblems('x', { base: { '@md': { contain: 'inline-size' } }, variants: {}, defaults: {} })).toEqual([
      'x.base.@md.contain: a step sets layout properties and textAlign only, from the component’s @md container width',
    ])
    expect(treeProblems('x', { base: { hover: { contain: 'inline-size' } }, variants: {}, defaults: {} })).toEqual(['x.base.hover.contain: contain sits on a base'])
    expect(recipeProblems({ contain: 'inline-size' }, 'panel')).toEqual([{ path: 'contain', message: 'contain sits on a base' }])
    expect(CONTAIN).toBe('contain')
    expect(CONTAIN_VALUES).toEqual(['inline-size'])
    const entries = recipeEntries({ flat: {}, trees: { x: { base: { contain: 'inline-size' }, variants: { v: { a: {} } }, defaults: {} } } })
    expect(entries[0].vars).toEqual([{ suffix: 'contain', declaration: 'inline-size', properties: ['container-type'] }])
    expect(entries[1].vars).toEqual([])
  })

  it('refuses an unknown step', () => {
    expect(treeProblems('x', { base: { '@xl': { gap: '{spacing.4}' } }, variants: {}, defaults: {} })).toEqual(["x.base.@xl: a step is '@sm', '@md' or '@lg'"])
  })

  it('gives a with block over a stepped value its own step, in the compound layer', () => {
    const tree = {
      variants: {
        size: { sm: { size: '{spacing.12}', '@md': { size: '{spacing.9}' }, with: { shape: { pill: { '@md': { size: '{spacing.10}' } } } } } },
        shape: { pill: { rounded: '{rounded.full}' } },
      },
      defaults: { size: 'sm', shape: 'pill' },
    }
    expect(problems(tree)).toEqual([])
    const entries = recipeEntries({ trees: { tag: tree } })
    const step = (layer) => entries.find((entry) => entry.layer === layer && entry.vars.some((v) => v.media === '@md'))?.vars.find((v) => v.media === '@md')
    expect(step('value')).toEqual(expect.objectContaining({ suffix: 'md-size', declaration: 'calc(var(--fui-spacing) * 9)' }))
    expect(step('compound')).toEqual(expect.objectContaining({ suffix: 'md-size', declaration: 'calc(var(--fui-spacing) * 10)' }))
  })

  it('takes {} as a base or an axis value: its class exists and sets nothing; a with block with nothing is refused', () => {
    const tree = { base: {}, variants: { mode: { default: {}, offcanvas: { backgroundColor: '{colors.muted}' } } }, defaults: { mode: 'default' } }
    expect(problems(tree)).toEqual([])
    expect(problems({ ...tree, variants: { ...tree.variants, tone: { a: { with: { mode: { default: {} } } } } } })).toEqual([
      'button.variants.tone.a.with.mode.default: a value is a block of properties, with the families it extends',
    ])
    expect(problems({ ...tree, variants: { ...tree.variants, tone: { a: { with: { mode: { offcanvas: { gap: '{spacing.1}' } } } } } } })).toEqual([])
    expect(problems({ base: [] })).toEqual(['button.base: a value is a block of properties, with the families it extends'])
    expect(recipeEntries({ trees: { rail: tree } })).toEqual([
      { recipe: 'rail', layer: 'base', vars: [] },
      { recipe: 'rail-default', layer: 'value', vars: [] },
      { recipe: 'rail-offcanvas', layer: 'value', vars: [expect.objectContaining({ suffix: 'background-color' })] },
    ])
  })

  it.each(['focus-ring', 'control'])('refuses a ring colour on the flat recipe %s: a family or a shared state never colours the ring', (name) => {
    expect(recipeProblems({ ringColor: '{colors.destructive}', ringBorderColor: '{colors.destructive}' }, name)).toEqual(
      ['ringColor', 'ringBorderColor'].map((path) => ({ path, message: 'colours the focus ring; a component’s own value sets it, never a family or a shared state recipe' })),
    )
  })

  it('a family carries layout and steps', () => {
    const flat = { 'surface-inset': { paddingY: '{spacing.6}', icon: { size: '{spacing.4}' }, '@md': { paddingY: '{spacing.8}' } } }
    expect(recipeProblems(flat['surface-inset'], 'surface-inset')).toEqual([])
    const entries = recipeEntries({ flat, trees: { card: { base: { extends: 'surface-inset', '@md': { gap: '{spacing.2}' } }, variants: {}, defaults: {} } } })
    expect(entries.find((e) => e.recipe === 'surface-inset').vars.map((v) => v.suffix)).toEqual(['padding-y', 'icon-size', 'md-padding-y'])
    expect(entries.find((e) => e.recipe === 'card').vars.map((v) => v.suffix)).toEqual(['padding-y', 'icon-size', 'md-padding-y', 'md-gap'])
    expect(recipeSetProblems({ flat, trees: {} })).toEqual([])
  })

  it('a bleed on a family negates once', () => {
    const entries = recipeEntries({ flat: { edge: { bleedX: '{spacing.4}' } }, trees: { x: { base: { extends: 'edge' }, variants: {}, defaults: {} } } })
    expect(entries.find((e) => e.recipe === 'x').vars.find((v) => v.suffix === 'bleed-x').declaration).toBe('calc(-1 * calc(var(--fui-spacing) * 4))')
  })

  it.each(['focus-ring', 'disabled', 'invalid'])('the shared state %s still refuses layout', (name) => {
    const message = 'a layout property sits in a component tree, or in a family it extends; never in a state'
    expect(recipeProblems({ paddingX: '{spacing.2}' }, name)).toEqual([{ path: 'paddingX', message }])
    expect(recipeProblems({ '@md': { paddingX: '{spacing.2}' } }, name)).toEqual([{ path: '@md', message }])
    expect(recipeProblems({ icon: { size: '{spacing.2}' } }, name)).toEqual([{ path: 'icon', message }])
    expect(recipeEntries({ flat: { [name]: { paddingX: '{spacing.2}', opacity: '{opacity.50}' } }, trees: {} })[0].vars.map((v) => v.suffix)).toEqual(['opacity'])
  })

  it('a ringed family refuses layout beside its ring colour', () => {
    expect(recipeProblems({ ringColor: '{colors.destructive}', paddingX: '{spacing.2}' }, 'ringed').map((p) => p.path)).toEqual(['ringColor', 'paddingX'])
  })

  it('a value reshapes its parts', () => {
    const trees = {
      card: { base: {}, variants: { surface: { bare: { paddingY: '{spacing.0}', parts: { 'card-header': { paddingX: '{spacing.0}', gap: '{spacing.1}' } } } } }, defaults: {} },
      'card-header': { base: { paddingX: '{spacing.8}', gap: '{spacing.2}' }, variants: {}, defaults: {} },
    }
    expect(treeProblems('card', trees.card)).toEqual([])
    expect(recipeSetProblems({ flat: {}, trees })).toEqual([])
    const entries = recipeEntries({ flat: {}, trees })
    const bare = entries.find((e) => e.recipe === 'card-bare')
    expect(bare.vars).toEqual([
      { suffix: 'padding-y', declaration: 'calc(var(--fui-spacing) * 0)', properties: ['padding-block'] },
      { suffix: 'card-header-padding-x', declaration: 'calc(var(--fui-spacing) * 0)', properties: [], part: 'card-header', partSuffix: 'padding-x' },
      { suffix: 'card-header-gap', declaration: 'calc(var(--fui-spacing) * 1)', properties: [], part: 'card-header', partSuffix: 'gap' },
    ])
    expect(entries.find((e) => e.recipe === 'card').vars).toEqual([
      { declaration: 'calc(var(--fui-spacing) * 8)', properties: [], part: 'card-header', partSuffix: 'padding-x', reset: true },
      { declaration: 'calc(var(--fui-spacing) * 2)', properties: [], part: 'card-header', partSuffix: 'gap', reset: true },
    ])
    expect(PARTS).toBe('parts')
  })

  it('a with block reshapes its parts too', () => {
    const trees = {
      card: { base: {}, variants: { surface: { bare: { with: { size: { sm: { parts: { 'card-header': { gap: '{spacing.1}' } } } } } } }, size: { sm: {} } }, defaults: {} },
      'card-header': { base: { gap: '{spacing.3}' }, variants: {}, defaults: {} },
    }
    expect(treeProblems('card', trees.card)).toEqual([])
    expect(recipeSetProblems({ flat: {}, trees })).toEqual([])
    const entries = recipeEntries({ flat: {}, trees })
    const pair = entries.find((e) => e.layer === 'compound')
    expect(pair.vars).toEqual([{ suffix: 'card-header-gap', declaration: 'calc(var(--fui-spacing) * 1)', properties: [], part: 'card-header', partSuffix: 'gap' }])
    expect(entries.find((e) => e.recipe === 'card').vars).toEqual([{ declaration: 'calc(var(--fui-spacing) * 3)', properties: [], part: 'card-header', partSuffix: 'gap', reset: true }])
  })

  it('a parts entry names a property the part’s base sets', () => {
    const card = {
      base: {},
      variants: {
        surface: { bare: { parts: { 'card-header': { paddingX: '{spacing.0}', gap: '{spacing.0}' } }, with: { size: { sm: { parts: { 'card-header': { paddingY: '{spacing.0}' } } } } } } },
        size: { sm: {} },
      },
      defaults: {},
    }
    const header = { base: { extends: 'inset', gap: '{spacing.2}' }, variants: { size: { sm: { paddingY: '{spacing.1}' } } }, defaults: {} }
    expect(recipeSetProblems({ flat: { inset: { paddingX: '{spacing.8}' } }, trees: { card, 'card-header': header } })).toEqual([
      'card.variants.surface.bare.with.size.sm.parts.card-header.paddingY: card-header’s base sets no paddingY',
    ])
    expect(recipeSetProblems({ flat: {}, trees: { card, 'card-header': { variants: { size: { sm: {} } }, defaults: {} } } })).toEqual([
      'card.variants.surface.bare.parts.card-header.paddingX: card-header’s base sets no paddingX',
      'card.variants.surface.bare.parts.card-header.gap: card-header’s base sets no gap',
      'card.variants.surface.bare.with.size.sm.parts.card-header.paddingY: card-header’s base sets no paddingY',
    ])
    const entries = recipeEntries({ flat: {}, trees: { card, 'card-header': { base: {}, variants: {}, defaults: {} } } })
    expect(entries.find((e) => e.recipe === 'card').vars).toEqual([])
  })

  it('parts name a part of this tree, layout only, never on a base or a flat recipe', () => {
    const tree = (parts) => ({ base: {}, variants: { surface: { bare: { parts } } }, defaults: {} })
    const trees = { card: tree({ button: { paddingX: '{spacing.0}' } }), 'card-header': { base: {}, variants: {}, defaults: {} }, 'card-footer': { base: {}, variants: {}, defaults: {} } }
    expect(recipeSetProblems({ flat: {}, trees })).toEqual(['card.variants.surface.bare.parts.button: not a layout part of card; card lists card-header, card-footer'])
    expect(recipeSetProblems({ flat: {}, trees: { card: tree({ 'card-header': { gap: '{spacing.0}' } }) } })).toEqual([
      'card.variants.surface.bare.parts.card-header: not a layout part of card; card lists no part',
    ])
    expect(recipeSetProblems({ flat: {}, trees: { card: tree({ 'card-header': { gap: '{spacing.0}' } }), 'card-header': { base: { gap: '{spacing.2}' }, variants: {}, defaults: {} } } })).toEqual([])
    expect(recipeEntries({ flat: {}, trees }).find((e) => e.recipe === 'card-bare').vars).toEqual([])
    expect(treeProblems('card', { base: { parts: { 'card-header': { paddingX: '{spacing.0}' } } }, variants: {}, defaults: {} })).toEqual(['card.base.parts: parts sit on a value or a with block'])
    expect(treeProblems('card', tree({ 'card-header': { textColor: 'red' } }))).toEqual(['card.variants.surface.bare.parts.card-header.textColor: a parts block sets layout properties only'])
    expect(treeProblems('card', tree({ 'card-header': { hover: { gap: '{spacing.1}' } } }))).toEqual(['card.variants.surface.bare.parts.card-header.hover: a parts block sets layout properties only'])
    expect(treeProblems('card', tree({ 'card-header': { '@md': { gap: '{spacing.1}' } } }))).toEqual(['card.variants.surface.bare.parts.card-header.@md: a parts block sets layout properties only'])
    expect(treeProblems('card', tree({ 'card-header': { contain: 'inline-size' } }))).toEqual(['card.variants.surface.bare.parts.card-header.contain: a parts block sets layout properties only'])
    expect(treeProblems('card', tree({ 'card-header': { gap: '{spacing.2.3}' } }))).toEqual([
      'card.variants.surface.bare.parts.card-header.gap: {spacing.2.3} — not a spacing step: {spacing.<n>}, <n> from 0 to 96 in quarters, or {spacing.px}',
    ])
    expect(treeProblems('card', tree({ 'card-header': {} }))).toEqual(['card.variants.surface.bare.parts.card-header: a part is a block of one or more layout properties'])
    expect(treeProblems('card', tree({}))).toEqual(['card.variants.surface.bare.parts: parts maps a part of the tree to a block of layout properties'])
    expect(treeProblems('card', tree('card-header'))).toEqual(['card.variants.surface.bare.parts: parts maps a part of the tree to a block of layout properties'])
    expect(recipeProblems({ parts: { 'card-header': { gap: '{spacing.1}' } } }, 'panel')).toEqual([{ path: 'parts', message: 'belongs to a component tree’s value; a flat recipe never carries it' }])
    expect(recipeSetProblems({ flat: { panel: { parts: { 'card-header': { gap: '{spacing.1}' } } } }, trees: {} })).toEqual([
      'recipe panel: parts belongs to a component tree’s value; a flat recipe never carries it',
    ])
  })

  it.each([
    { variants: { variant: { a: { height: '{spacing.9}' } } } },
    { variants: { variant: { a: { icon: { size: '{spacing.4}' } } } } },
    { variants: { side: { left: { width: '{spacing.96}', paddingStart: '{spacing.2}', gap: '{spacing.1}' } } } },
  ])('takes layout on any axis’s values: %j', (tree) => {
    expect(problems(tree)).toEqual([])
  })

  it('renders layout on a value of any axis', () => {
    const flat = flattenTree('tag', { variants: { side: { left: { width: '{spacing.96}', icon: { size: '{spacing.4}' } } } } }, families)
    expect(flat['tag-left']).toEqual({ width: '{spacing.96}', icon: { size: '{spacing.4}' } })
  })

  it.each([
    [{ base: { extends: 'action', rounded: '{rounded.full}' } }, { rounded: '{rounded.full}' }],
    [{ base: { extends: 'action', hover: { opacity: '{opacity.100}' } } }, { hover: { opacity: '{opacity.100}' } }],
  ])('lets a base override what a family it uses sets, its own declaration winning: %j', (tree, own) => {
    expect(problems(tree)).toEqual([])
    const base = flattenTree('button', tree, families).button
    expect(base).toMatchObject(own)
    expect(base.typography).toBe('{typography.ui}')
    expect(parseExtends(tree.base)).toEqual(['action'])
  })

  it.each([
    ['button-a', { variants: { variant: { a: { extends: 'action', rounded: '{rounded.full}' } } } }, { rounded: '{rounded.full}' }],
    ['button-a', { variants: { variant: { a: { extends: 'action', hover: { opacity: '{opacity.100}' } } } } }, { hover: { opacity: '{opacity.100}' } }],
    [
      'button-a-s',
      { variants: { variant: { a: { extends: 'action', with: { size: { s: { extends: 'action', hover: { opacity: '{opacity.100}' } } } } } }, size: { s: {} } } },
      { hover: { opacity: '{opacity.100}' } },
    ],
  ])('lets a value or a with block override what a family it uses sets, as a base does: %s %j', (cls, tree, own) => {
    expect(problems(tree)).toEqual([])
    const flat = flattenTree('button', tree, families)
    const def = flat[cls]
    expect(def).toMatchObject(own)
    expect(def.typography).toBe('{typography.ui}')
  })

  it('puts a value’s own declarations after the family it inlines, a block’s too', () => {
    const tree = { variants: { variant: { a: { extends: 'action', border: '{border.strong}', hover: { opacity: '{opacity.100}' } } } } }
    const def = flattenTree('button', tree, { ...families, action: { ...families.action, border: '{border.default}' } })['button-a']
    expect(Object.keys(def)).toEqual(['borderColor', 'rounded', 'typography', 'border', 'hover'])
    expect(def.border).toBe('{border.strong}')
    expect(def.hover).toEqual({ opacity: '{opacity.100}' })
    const base = flattenTree('button', { base: { extends: 'action', hover: { opacity: '{opacity.100}', textColor: '{colors.primary}' }, borderColor: '{colors.border}' } }, families).button
    expect(Object.keys(base)).toEqual(['border', 'rounded', 'typography', 'hover', 'borderColor'])
    expect(Object.keys(base.hover)).toEqual(['opacity', 'textColor'])
  })

  it('puts a with block’s own declarations after the family it inlines', () => {
    const tree = {
      variants: {
        variant: { a: { extends: 'action', with: { size: { s: { extends: 'action', border: '{border.strong}', hover: { opacity: '{opacity.100}' } } } } } },
        size: { s: { height: '{spacing.8}' } },
      },
    }
    const def = flattenTree('button', tree, { ...families, action: { ...families.action, border: '{border.default}' } })['button-a-s']
    expect(Object.keys(def)).toEqual(['borderColor', 'rounded', 'typography', 'border', 'hover'])
    expect(def.border).toBe('{border.strong}')
  })
})

describe('recipeSetProblems', () => {
  it('takes a set whose classes and variables are each their own', () => {
    const { ringed: _, ...renderable } = families
    expect(
      recipeSetProblems({ flat: renderable, trees: { button, 'field-separator': { base: { typography: '{typography.small}' } }, 'field-separator-rule': { base: { height: '{spacing.px}' } } } }),
    ).toEqual([])
  })

  it('refuses two classes writing one variable: a tree’s lineHeight and its -line part’s height', () => {
    const trees = { 'field-separator': { base: { typography: '{typography.small}' } }, 'field-separator-line': { base: { height: '{spacing.px}' } } }
    expect(recipeSetProblems({ flat: {}, trees })).toEqual(['fui-field-separator-line: writes --fui-field-separator-line-height, which fui-field-separator writes too; rename one'])
  })

  it('refuses two trees making one class', () => {
    const trees = { chip: { variants: { size: { 'x-lg': { height: '{spacing.8}' } } } }, 'chip-x': { variants: { size: { lg: { gap: '{spacing.1}' } } } } }
    expect(recipeSetProblems({ flat: {}, trees })).toContain('chip-x: makes fui-chip-x-lg, which chip makes too')
  })

  it('refuses a recipe named like a value’s class instead of renaming the value', () => {
    const trees = { button: { base: {}, variants: { size: { lg: {} } } }, 'button-lg': { base: {} } }
    expect(recipeSetProblems({ flat: {}, trees })).toEqual(['button-lg: makes fui-button-lg, which button makes too'])
    expect(recipeSetProblems({ flat: { 'button-lg': {} }, trees: { button: trees.button } })).toEqual(['button: makes fui-button-lg, which button-lg makes too'])
  })

  it('names a recipe of the pre-extends shape, as recipeEntries throws for it', () => {
    expect(recipeProblems({ use: 'x', opacity: '{opacity.100}' }, 'control')).toEqual([{ path: 'use', message: 'use moved to extends, the family by name' }])
    expect(() => recipeEntries({ flat: { control: { use: 'x', opacity: '{opacity.100}' } } })).toThrow('recipe control: use moved to extends, the family by name')
    expect(() => recipeEntries({ trees: { chip: { variants: { tone: { a: { hover: { use: 'x' } } } } } } })).toThrow('recipe chip: use moved to extends, the family by name')
    expect(() => recipeEntries({ trees: { chip: { variants: { tone: { a: { with: { mode: { use: { use: 'x' } } } } }, mode: { use: {} } } } } })).toThrow(
      'recipe chip: use moved to extends, the family by name',
    )
    expect(recipeEntries({ trees: { chip: { variants: { tone: { a: { with: { mode: { use: { opacity: '{opacity.100}' } } } } }, mode: { use: {} } } } } }).map((entry) => entry.recipe)).toEqual([
      'chip-a',
      'chip-use',
      'chip-a-use',
    ])
  })

  it('names a value written as a bare name, as recipeEntries throws for it', () => {
    expect(() => recipeEntries({ trees: { chip: { base: 'action' } } })).toThrow('recipe chip: a value is a block; write extends: action inside it')
    expect(() => recipeEntries({ trees: { chip: { variants: { tone: { a: ['action', 'control'] } } } } })).toThrow('recipe chip: a value is a block; write extends: [action, control] inside it')
    expect(() => recipeEntries({ trees: { chip: { variants: { tone: { a: { with: { size: { s: 'action' } } } }, size: { s: {} } } } } })).toThrow(
      'recipe chip: a value is a block; write extends: action inside it',
    )
  })

  it('names a tree of the pre-with shape, as recipeEntries throws for it', () => {
    const trees = { chip: { variants: { tone: { a: {} }, size: { s: {} } }, compounds: [{ when: { tone: 'a', size: 's' }, gap: '{spacing.1}' }] } }
    expect(() => recipeEntries({ trees })).toThrow('recipe chip: compounds moved under their first value as with')
    expect(recipeSetProblems({ flat: {}, trees })).toEqual(['recipe chip: compounds moved under their first value as with'])
  })

  it('refuses a pair written under both of its values', () => {
    const trees = {
      chip: {
        variants: {
          tone: { muted: { textColor: '{colors.muted-foreground}', with: { size: { sm: { gap: '{spacing.1}' } } } } },
          size: { sm: { with: { tone: { muted: { gap: '{spacing.2}' } } } } },
        },
      },
    }
    expect(recipeSetProblems({ flat: {}, trees })).toEqual(['chip: the pair muted + sm is written under both values; write it once'])
  })

  it('lists a pair after the values, with the values it wears and their classes in axis order', () => {
    const entries = treeEntries('button', button, families)
    expect(entries.find((entry) => entry.layer === 'compound')).toMatchObject({
      name: 'button-brand-primary-lg',
      when: { variant: 'brand-primary', size: 'lg' },
      classes: ['button-brand-primary', 'button-lg'],
    })
    expect(entries.map((entry) => entry.name)).toEqual(['button', 'button-brand-primary', 'button-destructive-secondary', 'button-xs', 'button-lg', 'button-brand-primary-lg'])
    const three = { variants: { a: { x: { with: { b: { y: { with: { c: { z: { gap: '{spacing.1}' } } } } } } } }, b: { y: {} }, c: { z: {} } } }
    expect(treeEntries('t', three).find((entry) => entry.layer === 'compound')).toMatchObject({ name: 't-x-y-z', when: { a: 'x', b: 'y', c: 'z' }, classes: ['t-x', 't-y', 't-z'] })
    expect(recipeProblems({ with: { size: {} } }, 'control')).toEqual([{ path: 'with', message: 'belongs to a component tree’s value; a flat recipe never carries it' }])
  })

  it('reports a flat recipe the build refuses instead of throwing', () => {
    expect(recipeSetProblems({ flat: { control: { with: { size: {} } } }, trees: {} })).toEqual(['recipe control: with belongs to a component tree’s value; a flat recipe never carries it'])
  })
})

import { axisCollisions, STATE_RECIPES, treeOwner } from '@frontic/library-contract/recipe'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SourceItem } from '../../scripts/lib/items'
import {
  brandNames,
  componentProblems,
  defaultBrandNames,
  expectedClasses,
  paletteProblems,
  readRegistryRecipes,
  recipePlacementProblems,
  recipeDefinitionProblems,
  recipeMapProblems,
  ownedTrees,
  SHARED_STATES,
  sharedStateVariant,
  foreignTreeProblems,
  itemComposesProblems,
} from '../../scripts/lib/recipes'

const names = defaultBrandNames()

describe('brandNames', () => {
  it('reads the default brand’s roles, text styles and borders', () => {
    expect(names.colors.has('primary-foreground')).toBe(true)
    expect(names.colors.has('buy')).toBe(true)
    expect([...names.rounded].sort()).toEqual(['base', 'full', 'lg', 'md', 'none', 'sm', 'xl'])
    expect([...names.shadow].sort()).toEqual(['lg', 'md', 'sm', 'xs'])
    expect([...names.typography]).toEqual([
      'heading',
      'body',
      'ui',
      'small',
      'caption',
      'control',
      'display',
      'headline',
      'page-title',
      'title',
      'subheading',
      'lead',
      'copy',
      'note',
      'description',
      'micro',
    ])
    expect([...names.border]).toEqual(['default', 'strong', 'focus', 'frame', 'frame-thin'])
    expect([...names.ring]).toEqual(['hairline', 'focus', 'wide', 'outset', 'frame', 'none'])
    expect(names.opacity.has('60')).toBe(true)
    expect([...names.container]).toContain('md')
  })
  it('fills the text styles and borders a brand lacks, as the brand build does', () => {
    const own = brandNames({ color: { surface: { background: {} } }, text: { poster: {} } })
    expect([...own.typography]).toEqual([
      'poster',
      'heading',
      'body',
      'ui',
      'small',
      'caption',
      'control',
      'display',
      'headline',
      'page-title',
      'title',
      'subheading',
      'lead',
      'copy',
      'note',
      'description',
      'micro',
    ])
    expect([...own.border]).toEqual(['default', 'strong', 'focus', 'frame', 'frame-thin'])
  })
})

function root(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'recipes-'))
  for (const [path, value] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  return dir
}

describe('readRegistryRecipes', () => {
  it('reads each tree from its item’s manifest and each flat recipe from recipes/shared/, with its path', () => {
    const dir = root({
      'ui/badge/Badge.vue': '<template />',
      'ui/badge/badge.json': { recipes: { badge: { base: { extends: 'control' } } } },
      'recipes/shared/control.json': { control: { backgroundColor: '{colors.primary}', hover: { opacity: '{opacity.90}' } } },
    })
    expect(readRegistryRecipes(dir)).toEqual({
      flat: { control: { backgroundColor: '{colors.primary}', hover: { opacity: '{opacity.90}' } } },
      trees: { badge: { base: { extends: 'control' } } },
      paths: { badge: 'ui/badge/badge.json', control: 'recipes/shared/control.json' },
    })
  })
  it('throws naming each file it cannot read, and when there are no recipes', () => {
    expect(() => readRegistryRecipes(root({ 'recipes/shared/a.json': '{', 'ui/badge/badge.json': { recipes: { badge: { base: {} } } } }))).toThrow(
      /^recipe files:\nrecipes\/shared\/a\.json: not JSON: /,
    )
    expect(() => readRegistryRecipes(root({ 'ui/badge/Badge.vue': '' }))).toThrow('recipe files: none under recipes/shared/ or in a manifest')
  })
  it('takes no other JSON in an item folder for a recipe', () => {
    expect(readRegistryRecipes(root({ 'ui/badge/data.json': { badge: { base: {} } }, 'recipes/shared/a.json': { a: { opacity: '{opacity.90}' } } })).trees).toEqual({})
  })
})

describe('recipePlacementProblems', () => {
  const maps = [
    { name: 'badge', tier: 'ui' as const, recipes: { default: 'badge', 'focus-ring': 'focus-ring' } },
    { name: 'card', tier: 'ui' as const, recipes: { default: 'card' } },
  ]
  const place = (paths: Record<string, string>) => {
    const recipes = { flat: {}, trees: {}, paths } as { flat: Record<string, Record<string, unknown>>; trees: Record<string, Record<string, unknown>>; paths: Record<string, string> }
    for (const name of Object.keys(paths)) (name === 'card' || name === 'badge' ? recipes.trees : recipes.flat)[name] = {}
    return recipePlacementProblems(recipes, maps)
  }
  it('passes each tree in its item’s manifest and each flat recipe in its own recipes/shared/ file, mapped flats included', () => {
    expect(place({ badge: 'ui/badge/badge.json', card: 'ui/card/card.json', 'focus-ring': 'recipes/shared/focus-ring.json' })).toEqual([])
  })
  it('names a flat recipe in a manifest', () => {
    expect(place({ badge: 'ui/badge/badge.json', card: 'ui/card/card.json', 'focus-ring': 'ui/badge/badge.json' })).toContain(
      'ui/badge/badge.json: focus-ring is a flat recipe; flat recipes sit in recipes/shared/',
    )
  })
  it('names a shared file holding a recipe it is not named after', () => {
    expect(place({ badge: 'ui/badge/badge.json', card: 'ui/card/card.json', 'focus-ring': 'recipes/shared/ring.json' })).toEqual([
      'recipes/shared/ring.json: holds focus-ring; a shared file holds the one recipe it is named after',
    ])
  })
  it('names a tree in recipes/shared/', () => {
    expect(place({ badge: 'ui/badge/badge.json', card: 'recipes/shared/card.json' })).toContain('recipes/shared/card.json: card is a tree; a tree sits in the manifest of the item that maps it')
  })
  it('names a tree in a manifest whose item does not map it', () => {
    expect(place({ badge: 'ui/card/card.json', card: 'ui/card/card.json' })).toEqual(['ui/card/card.json: card does not map badge; a manifest’s recipes are the trees its item maps'])
  })
})

describe('recipeDefinitionProblems', () => {
  const check = (def: Record<string, unknown>, name = 'badge-primary') => recipeDefinitionProblems({ flat: { [name]: def }, trees: {} }, names)
  it('accepts decorative: true and a colour ground, and no other boolean', () => {
    expect(check({ textColor: '{colors.muted-foreground}', decorative: true, ground: '{colors.foreground}' })).toEqual([])
    expect(check({ opacity: true })).toEqual(['badge-primary.opacity: must be a string of 1 to 500 characters or a number'])
  })
  it('accepts role, text-style and border references, literal dimensions and state blocks', () => {
    expect(
      check({
        backgroundColor: '{colors.primary}',
        rounded: '{rounded.full}',
        shadow: '{shadow.sm}',
        typography: '{typography.ui}',
        border: '{border.default}',
        outline: '{ring.focus}',
        opacity: '{opacity.50}',
        hover: { backgroundColor: '{colors.active}' },
        active: { opacity: '{opacity.90}' },
        focus: { borderColor: '{colors.ring}' },
        checked: { backgroundColor: '{colors.primary}' },
        highlighted: { backgroundColor: '{colors.accent}' },
        open: { backgroundColor: '{colors.accent}' },
        selected: { textColor: '{colors.primary-foreground}' },
      }),
    ).toEqual([])
    expect(check({ backgroundColor: '{colors.muted}' }, 'calendar-day-today')).toEqual([])
    expect(check({ outline: '{ring.focus}' }, 'focus-ring')).toEqual([])
    expect(check({ iconColor: '{colors.info}', borderColor: '{colors.info}' }, 'notice-info')).toEqual([])
  })
  it('takes one side’s border from {border.*} and one corner’s radius from {rounded.*}', () => {
    expect(check({ borderTop: '{border.default}', borderLeft: '{border.strong}', borderTopLeftRadius: '{rounded.xl}', borderBottomRightRadius: '{rounded.none}' })).toEqual([])
    expect(check({ borderRight: '{colors.border}', borderTopRightRadius: '4px', borderBottomLeftRadius: '{border.default}' })).toEqual([
      'badge-primary.borderRight: {colors.border} — borderRight takes {border.<name>}',
      'badge-primary.borderTopRightRadius: 4px — borderTopRightRadius takes {rounded.<name>}',
      'badge-primary.borderBottomLeftRadius: {border.default} — borderBottomLeftRadius takes {rounded.<name>}',
    ])
  })
  it('accepts layout on a family, never on a shared state', () => {
    expect(check({ height: '{spacing.9}', '@md': { height: '{spacing.10}' } }, 'control')).toEqual([])
    expect(check({ height: '{spacing.9}' }, 'focus-ring')).toEqual(['focus-ring.height: a layout property sits in a component tree, or in a family it extends; never in a state'])
  })
  it('accepts a file block, the file selector button, of the properties a state block takes', () => {
    expect(check({ file: { backgroundColor: 'transparent', border: 'none', typography: '{typography.ui}', textColor: '{colors.foreground}' } }, 'control-line')).toEqual([])
  })
  it('accepts a colour reference with an alpha on a colour property, flat and in a state', () => {
    expect(
      check({ backgroundColor: '{colors.primary/20}', outlineColor: '{colors.ring/50}', hover: { backgroundColor: '{colors.destructive/0}' }, focus: { textColor: '{colors.primary/100}' } }),
    ).toEqual([])
  })
  it.each([
    [{ backgroundColor: '#ff0000' }, /backgroundColor takes \{colors/],
    [{ fontFamily: 'oklch(0.5 0.1 20)' }, /colour/],
    [{ padding: '2px 8px' }, /a layout property takes \{spacing\.<n>\}/],
    [{ textColor: '{colors.brand-teal}' }, /no colors.brand-teal/],
    [{ rounded: '4px' }, /rounded takes \{rounded/],
    [{ typography: '{typography.button}' }, /no typography.button/],
    [{ border: '1px solid' }, /border takes \{border\.<name>\} or none/],
    [{ outline: '{ring.ink}' }, /no ring.ink/],
    [{ outline: '{border.focus}' }, /outline takes \{ring/],
    [{ iconColor: 'red' }, /iconColor takes \{colors/],
    [{ fontFamily: '{spacing.2}' }, /a spacing step sets a layout property only/],
    [{ fontFamily: '{constructor.name}' }, /group/],
    [{ fontFamily: 4 }, /string/],
    [{ outlineOffset: '2px' }, /outlineOffset — width, style and offset live in the ring token/],
    [{ fontWeight: 600 }, /fontWeight takes normal, medium, semibold, bold/],
    [{ opacity: '0.5' }, /opacity takes \{opacity/],
    [{ 'pad ding': '1px' }, /property/],
    [{ hover: 'x' }, /block/],
    [{ hover: { active: { opacity: '{opacity.100}' } } }, /state inside a state/],
    [{ checked: { open: { opacity: '{opacity.100}' } } }, /state inside a state/],
    [{ hover: { backgroundColor: '#ff0000' } }, /hover\.backgroundColor: #ff0000 — backgroundColor takes/],
    [{ today: { opacity: '{opacity.100}' } }, /today: must be a string/],
    [{ color: 'red' }, /color: red — color takes \{colors/],
    [{ background: 'white' }, /background: white — background takes \{colors/],
    [{ caretColor: 'blue' }, /caretColor: blue — caretColor takes \{colors/],
    [{}, /a block of one or more properties/],
    [{ hover: {} }, /hover: a state is a block of one or more properties/],
    [{ file: {} }, /file: a part is a block of one or more properties/],
    [{ file: { hover: { opacity: '{opacity.100}' } } }, /file\.hover: a state inside a part/],
    [{ hover: { file: { opacity: '{opacity.100}' } } }, /hover\.file: a part inside a state/],
    [{ file: { backgroundColor: '#fff' } }, /file\.backgroundColor: #fff — backgroundColor takes \{colors/],
    [{ backgroundColor: '{colors.brand-teal/20}' }, /no colors.brand-teal/],
    [{ rounded: '{colors.primary/10}' }, /rounded: .* colour property only/],
    [{ fontFamily: '{colors.primary/10}' }, /fontFamily: .* colour property only/],
    [{ backgroundColor: '{colors.primary/101}' }, /whole percent from 0 to 100/],
    [{ hover: { backgroundColor: '{colors.primary/7.5}' } }, /hover\.backgroundColor: .* whole percent from 0 to 100/],
    [{ backgroundColor: '{rounded.full/20}' }, /token/],
    [{ backgroundColor: '{colors.primary /50}' }, /backgroundColor: \{colors\.primary \/50\} — not a token reference/],
    [{ backgroundColor: '{color.primary/50}' }, /backgroundColor: \{color\.primary\/50\} — \{color\.…\} is not a token group/],
    [{ fileColor: '{colors.primary}' }, /fileColor: its variable collides with the file block’s/],
    [{ hoverColor: '{colors.primary}', hover: { color: '{colors.primary}' } }, /hoverColor: its variable collides with the hover block’s/],
    [{ file: { iconColor: '{colors.primary}' } }, /file\.iconColor: styles an element inside; the file part has none/],
    [{ file: { placeholderColor: '{colors.primary}' } }, /file\.placeholderColor: styles an element inside/],
  ])('refuses %j', (def, message) => {
    expect(check(def).join('\n')).toMatch(message)
  })
  it.each(['button-brand-primary-hover', 'choice-checked', 'menu-item-highlighted', 'nav-open', 'calendar-day-selected', 'input-file'])(
    'refuses %s: a state or part as a recipe of its own',
    (name) => {
      expect(check({ backgroundColor: '{colors.active}' }, name).join('\n')).toMatch(/states and parts live inside the value recipe/)
    },
  )
  it('refuses a well-formed reference to a colour the brand lacks, which the contract cannot know', () => {
    expect(check({ backgroundColor: '{colors.nope/50}', textColor: '{colors.nope}' })).toEqual([
      'badge-primary.backgroundColor: the generic brand has no colors.nope',
      'badge-primary.textColor: the generic brand has no colors.nope',
    ])
  })
  it('reports each problem once: the contract’s, else the gate’s', () => {
    expect(check({ backgroundColor: '{colors.primary/101}' })).toEqual(['badge-primary.backgroundColor: {colors.primary/101} — the alpha after / is a whole percent from 0 to 100'])
  })
  it.each([
    ['textColor', '{typography.ui}', 'badge-primary.textColor: {typography.ui} — a text style expands on typography only'],
    ['rounded', '{colors.primary}', 'badge-primary.rounded: {colors.primary} — rounded takes {rounded.<name>}'],
    ['typography', '{colors.primary}', 'badge-primary.typography: {colors.primary} — typography takes {typography.<name>}'],
    ['borderColor', '{border.default}', 'badge-primary.borderColor: {border.default} — borderColor takes {colors.<name>}'],
    ['border', '{colors.border}', 'badge-primary.border: {colors.border} — border takes {border.<name>}'],
    ['shadow', '{border.strong}', 'badge-primary.shadow: {border.strong} — shadow takes {shadow.<name>}'],
    ['color', '{shadow.sm}', 'badge-primary.color: {shadow.sm} — color takes {colors.<name>}'],
    ['background', '{typography.body}', 'badge-primary.background: {typography.body} — a text style expands on typography only'],
  ])('refuses %s: %s, a reference outside the property’s group', (prop, value, message) => {
    expect(check({ [prop]: value })).toEqual([message])
    expect(check({ hover: { [prop]: value } })).toEqual([message.replace(`badge-primary.${prop}`, `badge-primary.hover.${prop}`)])
  })
  it('refuses an untyped property: the registry ships typed recipes only, though a project may warn and render one', () => {
    expect(check({ cursor: 'pointer' })).toEqual(['badge-primary.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value'])
  })
  it('takes outline from a ring token only', () => {
    expect(check({ outline: '{ring.focus}' })).toEqual([])
    expect(check({ outline: '2px solid transparent' })).toEqual(['badge-primary.outline: 2px solid transparent — outline takes {ring.<name>}'])
  })
  it.each(['transparent', 'currentColor'])('takes %s on a colour property, inside a state too', (keyword) => {
    expect(check({ backgroundColor: keyword, iconColor: keyword, open: { textColor: keyword, borderColor: keyword } })).toEqual([])
  })
  it('takes none on shadow, inside a state too, and no other literal', () => {
    expect(check({ shadow: 'none', hover: { shadow: 'none' } })).toEqual([])
    expect(check({ shadow: '0 1px 2px black' })).toEqual(['badge-primary.shadow: 0 1px 2px black — shadow takes {shadow.<name>} or none'])
    expect(check({ backgroundColor: 'none' })).toEqual(['badge-primary.backgroundColor: none — backgroundColor takes {colors.<name>}, {colors.<name>/<NN>}, transparent or currentColor'])
  })
  it('refuses a ring colour on a family: a component’s own value sets it', () => {
    expect(check({ ringColor: '{colors.destructive/20}' }, 'control')).toEqual(['control.ringColor: colours the focus ring; a component’s own value sets it, never a family or a shared state recipe'])
  })
  it.each(['focus-ring', 'disabled', 'invalid'])('refuses a ring colour on the shared state recipe %s', (name) => {
    expect(check({ outlineColor: '{colors.ring}', ringColor: '{colors.destructive/20}', ringBorderColor: '{colors.destructive}' }, name)).toEqual([
      `${name}.ringColor: colours the focus ring; a component’s own value sets it, never a family or a shared state recipe`,
      `${name}.ringBorderColor: colours the focus ring; a component’s own value sets it, never a family or a shared state recipe`,
    ])
    expect(Object.keys(SHARED_STATES)).toEqual([...STATE_RECIPES])
  })
  it('refuses a recipe name the save refuses', () => {
    expect(check({ textColor: '{colors.primary}' }, 'Badge')).toHaveLength(1)
    expect(check({ outline: '{ring.focus}' }, 'focus-ring')).toEqual([])
  })
})

describe('recipeDefinitionProblems on a component tree', () => {
  const flat = { action: { border: '{border.default}', rounded: '{rounded.md}' }, 'focus-ring': { outline: '{ring.focus}' } }
  const check = (tree: Record<string, unknown>) => recipeDefinitionProblems({ flat, trees: { button: tree } }, names)
  it('accepts a tree on the generic brand’s names, spacing steps in its sizes', () => {
    expect(
      check({
        base: { extends: 'action' },
        variants: {
          variant: { a: { backgroundColor: '{colors.primary}', ringColor: '{colors.destructive/20}' } },
          size: { xs: { height: '{spacing.6}', typography: '{typography.caption}', icon: { size: '{spacing.3}' } } },
        },
        defaults: { variant: 'a', size: 'xs' },
      }),
    ).toEqual([])
  })
  it('reports the contract’s problems, then the gate’s on the brand’s names', () => {
    expect(check({ base: { extends: 'nope' } })).toEqual(['button.base.extends: nope is not a flat recipe'])
    expect(check({ variants: { variant: { a: { backgroundColor: '{colors.nope}' } } } })).toEqual(['button.variants.variant.a.backgroundColor: the generic brand has no colors.nope'])
    expect(check({ base: { rounded: '4px' } })).toEqual(['button.base.rounded: 4px — rounded takes {rounded.<name>}'])
  })
  it('takes a width from the generic brand’s container sizes', () => {
    expect(check({ variants: { size: { md: { maxWidth: '{container.xs}', '@md': { maxWidth: '{container.md}' } } } }, defaults: { size: 'md' } })).toEqual([])
    expect(check({ base: { maxWidth: '{container.huge}' } })).toEqual(['button.base.maxWidth: the generic brand has no container.huge'])
  })
  it('takes contain on a base and a parts block on a value, each part’s layout checked like a step’s', () => {
    const trees = {
      card: { base: { contain: 'inline-size' }, variants: { surface: { bare: { parts: { 'card-header': { paddingX: '{spacing.0}' } } } } }, defaults: { surface: 'bare' } },
      'card-header': { base: { paddingX: '{spacing.8}' } },
    }
    expect(recipeDefinitionProblems({ flat, trees }, names)).toEqual([])
    const bad = { ...trees, card: { ...trees.card, variants: { surface: { bare: { parts: { 'card-header': { maxWidth: '{container.huge}' } } } } } } }
    expect(recipeDefinitionProblems({ flat, trees: bad }, names)).toEqual(['card.variants.surface.bare.parts.card-header.maxWidth: the generic brand has no container.huge'])
  })
})

const button = {
  base: { extends: 'action' },
  variants: {
    variant: { 'brand-primary': { backgroundColor: '{colors.primary}' }, inverse: { backgroundColor: '{colors.background}', with: { size: { lg: { paddingX: '{spacing.3}' } } } } },
    size: { sm: { height: '{spacing.8}' }, lg: { height: '{spacing.10}' } },
  },
  defaults: { variant: 'brand-primary', size: 'sm' },
}
const component = (cva: string, name = 'button'): SourceItem => ({
  name,
  tier: 'ui',
  type: 'registry:ui',
  files: { 'Button.vue': `<script setup lang="ts">\nconst button = ${cva}\n</script>`, 'index.ts': '' },
})
const GOOD = `cva('fui-button inline-flex focus-visible:fui-focus-ring', {
  variants: {
    variant: { 'brand-primary': 'fui-button-brand-primary', inverse: 'fui-button-inverse' },
    size: { sm: 'fui-button-sm', lg: 'fui-button-lg' },
  },
  defaultVariants: { variant: 'brand-primary', size: 'sm' },
})`

describe('expectedClasses', () => {
  it('names what each cva slot holds; a pair is no slot', () => {
    expect(expectedClasses('button', button)).toEqual({
      base: 'fui-button',
      variants: { variant: { 'brand-primary': 'fui-button-brand-primary', inverse: 'fui-button-inverse' }, size: { sm: 'fui-button-sm', lg: 'fui-button-lg' } },
      defaultVariants: { variant: 'brand-primary', size: 'sm' },
    })
  })
})

describe('componentProblems', () => {
  it('takes a cva that holds exactly the tree’s classes', () => {
    expect(componentProblems(component(GOOD), button)).toEqual([])
  })
  it('reports a slot holding a utility or a foreign class', () => {
    expect(componentProblems(component(GOOD.replace("sm: 'fui-button-sm'", "sm: 'fui-button-sm h-9'")), button)).toEqual([
      'button: variants.size.sm holds "fui-button-sm h-9"; the tree makes it "fui-button-sm"',
    ])
    expect(componentProblems(component(GOOD.replace("inverse: 'fui-button-inverse'", "inverse: 'fui-control'")), button)).toEqual([
      'button: variants.variant.inverse holds "fui-control"; the tree makes it "fui-button-inverse"',
    ])
  })
  it('reports a base without its class, or naming a family or a value', () => {
    expect(componentProblems(component(GOOD.replace("'fui-button inline-flex", "'inline-flex")), button)).toEqual(['button: the cva base lacks fui-button'])
    expect(componentProblems(component(GOOD.replace("'fui-button inline-flex", "'fui-button fui-control fui-button-sm inline-flex")), button)).toEqual([
      'button: the cva base holds fui-control, which the tree does not put there',
      'button: the cva base holds fui-button-sm, which the tree does not put there',
    ])
  })
  it('reports defaults and values that differ from the tree', () => {
    expect(componentProblems(component(GOOD.replace("defaultVariants: { variant: 'brand-primary', size: 'sm' }", "defaultVariants: { variant: 'inverse', size: 'sm' }")), button)).toEqual([
      'button: defaultVariants is {"variant":"inverse","size":"sm"}; the tree’s defaults are {"variant":"brand-primary","size":"sm"}',
    ])
    expect(componentProblems(component(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg', xl: 'fui-button-xl' ")), button)).toEqual([
      'button: variants.size.xl is a value the tree does not define',
    ])
  })
  it('refuses a compoundVariants entry wearing a recipe class: a pair is a rule over its values; one wearing utilities passes', () => {
    const withCompound = (cls: string) => GOOD.replace('\n  defaultVariants', `\n  compoundVariants: [{ variant: 'inverse', size: 'lg', class: '${cls}' }],\n  defaultVariants`)
    expect(componentProblems(component(withCompound('fui-button-inverse-lg')), button)).toEqual([
      'button: compoundVariants { variant: inverse, size: lg } wears fui-button-inverse-lg; a pair is a rule over its values, not a class',
    ])
    expect(componentProblems(component(withCompound('shadow-lg')), button)).toEqual([])
  })
  it('reads a component without a cva by its class attribute, and wants one for a tree with axes', () => {
    const input = { base: { height: '{spacing.9}' } }
    const file = (cls: string): SourceItem => ({
      name: 'input',
      tier: 'ui',
      type: 'registry:ui',
      files: { 'Input.vue': `<template><input :class="['${cls}', props.class]" /></template>`, 'index.ts': '' },
    })
    expect(componentProblems(file('fui-input w-full focus-visible:fui-focus-ring'), input)).toEqual([])
    expect(componentProblems(file('w-full'), input)).toEqual(['input: Input.vue lacks fui-input'])
    expect(componentProblems(file('fui-input'), { ...input, variants: { size: { sm: { height: '{spacing.8}' } } } })).toEqual(['input: Input.vue has no cva; its tree has variants'])
  })
  it('reads a part’s tree in the file that wears its class, beside the item’s own cva', () => {
    const thumb = { base: { size: '{spacing.4}' }, variants: { size: { sm: { size: '{spacing.3}' } } }, defaults: { size: 'sm' } }
    const SWITCH = `<script setup lang="ts">
const root = cva('fui-switch', { variants: {}, defaultVariants: {} })
const thumb = cva('fui-switch-thumb block', { variants: { size: { sm: 'fui-switch-thumb-sm' } }, defaultVariants: { size: 'sm' } })
</script>`
    const item = (files: Record<string, string>): SourceItem => ({ name: 'switch', tier: 'ui', type: 'registry:ui', files })
    expect(componentProblems(item({ 'Switch.vue': SWITCH }), thumb, 'switch-thumb')).toEqual([])
    expect(componentProblems(item({ 'Switch.vue': SWITCH.replace("sm: 'fui-switch-thumb-sm'", "sm: 'size-3'") }), thumb, 'switch-thumb')).toEqual([
      'switch-thumb: variants.size.sm holds "size-3"; the tree makes it "fui-switch-thumb-sm"',
    ])
    expect(componentProblems(item({ 'Switch.vue': '<i class="fui-switch" />', 'SwitchThumb.vue': '<i class="fui-switch-thumb" />' }), { base: { size: '{spacing.4}' } }, 'switch-thumb')).toEqual([])
    expect(componentProblems(item({ 'Switch.vue': '<i class="fui-switch" />' }), { base: { size: '{spacing.4}' } }, 'switch-thumb')).toEqual(['switch-thumb: no file of switch wears fui-switch-thumb'])
  })
  it('reads a part’s tree in the file whose cva holds it, though another file wears its class first', () => {
    const tree = { base: { gap: '{spacing.2}' }, variants: { variant: { destructive: { extends: 'menu-item-destructive' } } }, defaults: {} }
    const files = {
      'MenuCheckboxItem.vue': `<template><i :class="['fui-menu-item', props.class]" /></template>`,
      'MenuItem.vue': `<script setup lang="ts">\nconst item = cva('fui-menu-item flex', { variants: { variant: { destructive: 'fui-menu-item-destructive' } }, defaultVariants: {} })\n</script>`,
    }
    const menu = (f: Record<string, string>): SourceItem => ({ name: 'menu', tier: 'ui', type: 'registry:ui', files: f })
    expect(componentProblems(menu(files), tree, 'menu-item')).toEqual([])
    expect(componentProblems(menu({ 'MenuCheckboxItem.vue': files['MenuCheckboxItem.vue'] }), tree, 'menu-item')).toEqual(['menu-item: MenuCheckboxItem.vue has no cva; its tree has variants'])
  })
})

const item = (files: Record<string, string>, tier: SourceItem['tier'] = 'ui'): SourceItem => ({ name: 'dialog', tier, type: 'registry:ui', files })
// A manifest entry from a part map: each `<part>: <item>-<part>` an own tree, each `<name>: <name>` composed on the root tree.
const shaped = (name: string, map: Record<string, string>) => {
  const own = Object.entries(map).filter(([key, recipe]) => key !== recipe || recipe === name)
  const composes = Object.entries(map).flatMap(([key, recipe]) => (key === recipe && recipe !== name ? [recipe] : []))
  const recipes: Record<string, object> = Object.fromEntries(own.map(([, recipe]) => [recipe, { base: {} }]))
  if (composes.length) recipes[name] = { composes, ...recipes[name] }
  return { name, recipes }
}
const entry = (map: Record<string, string>) => shaped('dialog', map)

describe('recipeMapProblems', () => {
  it('reads every non-demo file: a part’s family recipe counts', () => {
    const files = { 'Dialog.vue': '<template />', 'DialogContent.vue': '<div class="fui-overlay-modal focus-visible:fui-focus-ring" />' }
    expect(recipeMapProblems(item(files), entry({ 'overlay-modal': 'overlay-modal', 'focus-ring': 'focus-ring' }))).toEqual([])
  })
  it('names a used recipe the map lacks, a mapped one no file uses, and an empty base map', () => {
    expect(recipeMapProblems(item({ 'Dialog.vue': '<div class="fui-dialog-x" />' }), entry({ y: 'dialog-y' }))).toEqual([
      'dialog uses fui-dialog-x, which is neither one of its trees nor composed by one',
      'dialog maps dialog-y, but no file uses fui-dialog-y',
    ])
    expect(recipeMapProblems(item({ 'Dialog.vue': '' }), entry({}))).toEqual(['dialog: a Base Component names at least one recipe'])
  })
  it('asks no recipe of an item that ships only script, its demo aside', () => {
    expect(recipeMapProblems(item({ 'index.ts': '', 'keys.ts': '', 'dialog.example.vue': '<template />' }), entry({}))).toEqual([])
  })
  it('refuses a recipe class in the demo', () => {
    expect(recipeMapProblems(item({ 'Dialog.vue': '<i class="fui-dialog" />', 'dialog.example.vue': '<i class="fui-dialog" />' }), entry({ default: 'dialog' }))).toEqual([
      'dialog: dialog.example.vue uses fui-dialog; an example styles nothing itself',
    ])
  })
  it('refuses a recipe behind a pseudo-class or an attribute variant, and a shared state recipe off its variant', () => {
    const files = { 'Dialog.vue': '<i class="fui-dialog hover:fui-dialog data-checked:fui-choice aria-selected:fui-dialog fui-disabled data-checked:fui-focus-ring" />' }
    expect(recipeMapProblems(item(files), entry({ default: 'dialog', choice: 'choice', disabled: 'disabled', 'focus-ring': 'focus-ring' }))).toEqual([
      'dialog: hover:fui-dialog — a value’s states live inside its recipe; write fui-dialog bare',
      'dialog: data-checked:fui-choice — a value’s states live inside its recipe; write fui-choice bare',
      'dialog: aria-selected:fui-dialog — a value’s states live inside its recipe; write fui-dialog bare',
      'dialog: fui-disabled sits behind disabled:, aria-disabled: or data-disabled:',
      'dialog: data-checked:fui-focus-ring sits behind focus-visible:',
    ])
  })
  it('counts a tree’s classes as the tree it maps under default', () => {
    const files = { 'Dialog.vue': '<i class="fui-dialog fui-dialog-sm fui-dialog-x" />' }
    const trees = {
      dialog: {
        base: { opacity: '{opacity.100}' },
        variants: { size: { sm: { height: '{spacing.4}', with: { tone: { x: { opacity: '{opacity.100}' } } } } }, tone: { x: { opacity: '{opacity.100}' } } },
      },
    }
    expect(recipeMapProblems(item(files), entry({ default: 'dialog' }), trees)).toEqual([])
    expect(recipeMapProblems(item({ 'Dialog.vue': '<i class="fui-dialog fui-dialog-xl" />' }), entry({ default: 'dialog' }), trees)).toEqual([
      'dialog uses fui-dialog-xl, which is neither one of its trees nor composed by one',
    ])
    expect(recipeMapProblems(item({ 'Dialog.vue': '<i class="fui-dialog fui-dialog-sm-x" />' }), entry({ default: 'dialog' }), trees)).toEqual([
      'dialog uses fui-dialog-sm-x, which is neither one of its trees nor composed by one',
    ])
  })
  it('takes a shared state behind a peer’s or a named group’s variant: a label shows its control’s and its field’s', () => {
    const files = { 'Dialog.vue': `<i class="fui-dialog peer-disabled:fui-disabled group-data-disabled/field:fui-disabled group-focus-visible:fui-focus-ring" />` }
    expect(recipeMapProblems(item(files), entry({ default: 'dialog', disabled: 'disabled', 'focus-ring': 'focus-ring' }), { dialog: { base: { opacity: '{opacity.100}' } } })).toEqual([])
    expect(sharedStateVariant('disabled', 'peer-hover')).toBe(false)
    expect(sharedStateVariant('invalid', 'group-aria-invalid/field')).toBe(true)
    expect(sharedStateVariant('disabled', 'peer-disabled/Field')).toBe(false)
  })
  it('takes a group’s ring from a focused descendant', () => {
    const files = { 'Dialog.vue': `<i class="fui-dialog has-focus-visible:fui-focus-ring has-aria-invalid:fui-invalid has-disabled:fui-disabled" />` }
    expect(
      recipeMapProblems(item(files), entry({ default: 'dialog', disabled: 'disabled', invalid: 'invalid', 'focus-ring': 'focus-ring' }), { dialog: { base: { opacity: '{opacity.100}' } } }),
    ).toEqual([])
  })
  it('rings behind data-active only in input-otp, where the slot stands for the caret: a current nav link would ring forever', () => {
    const files = { 'Slot.vue': '<i class="fui-input-otp-slot data-active:fui-focus-ring" />' }
    const otp = { name: 'input-otp', tier: 'ui' as const, type: 'registry:ui', files }
    const otpEntry = shaped('input-otp', { slot: 'input-otp-slot', 'focus-ring': 'focus-ring' })
    expect(recipeMapProblems(otp, otpEntry)).toEqual([])
    const nav = { ...otp, name: 'navigation-menu', files: { 'Link.vue': '<i class="fui-navigation-menu-link data-active:fui-focus-ring" />' } }
    const navEntry = shaped('navigation-menu', { link: 'navigation-menu-link', 'focus-ring': 'focus-ring' })
    expect(recipeMapProblems(nav, navEntry)).toEqual(['navigation-menu: data-active:fui-focus-ring sits behind focus-visible:'])
    expect(sharedStateVariant('focus-ring', 'data-active')).toBe(false)
    expect(sharedStateVariant('focus-ring', 'data-active', 'input-otp')).toBe(true)
    expect(sharedStateVariant('focus-ring', 'group-data-active', 'input-otp')).toBe(false)
    expect(sharedStateVariant('disabled', 'has-[select:disabled]', 'native-select')).toBe(true)
    expect(sharedStateVariant('disabled', 'has-[select:disabled]')).toBe(false)
    expect(sharedStateVariant('disabled', 'data-active', 'input-otp')).toBe(false)
  })
  it.each([
    ['input-otp', 'data-active:aria-invalid'],
    ['checkbox', 'aria-checked:aria-invalid'],
  ])('takes %s’s invalid again behind its own two states, and only that pair', (name, chain) => {
    const files = { 'Slot.vue': `<i class="fui-${name}-x aria-invalid:fui-invalid ${chain}:fui-invalid" />` }
    const entryOf = (n: string) => shaped(n, { x: `${n}-x`, invalid: 'invalid' })
    expect(recipeMapProblems({ name, tier: 'ui', type: 'registry:ui', files }, entryOf(name))).toEqual([])
    expect(recipeMapProblems({ name: 'dialog', tier: 'ui', type: 'registry:ui', files: { 'Slot.vue': files['Slot.vue'].replace(`fui-${name}-x`, 'fui-dialog-x') } }, entryOf('dialog'))).toEqual([
      `dialog: ${chain}:fui-invalid sits behind aria-invalid:`,
    ])
    const other = { 'Slot.vue': `<i class="fui-${name}-x hover:aria-invalid:fui-invalid" />` }
    expect(recipeMapProblems({ name, tier: 'ui', type: 'registry:ui', files: other }, entryOf(name))).toEqual([`${name}: hover:aria-invalid:fui-invalid sits behind aria-invalid:`])
  })
  it('refuses a component recipe behind a has- variant, the sidebar’s too', () => {
    const files = { 'SidebarProvider.vue': '<i class="has-data-variant-inset:fui-sidebar-wrapper" />' }
    const sidebar = { name: 'sidebar', tier: 'ui' as const, type: 'registry:ui', files }
    expect(recipeMapProblems(sidebar, shaped('sidebar', { wrapper: 'sidebar-wrapper' }))).toEqual([
      'sidebar: has-data-variant-inset:fui-sidebar-wrapper — a value’s states live inside its recipe; write fui-sidebar-wrapper bare',
    ])
  })
  it('takes the shared state recipes behind their variants', () => {
    const files = {
      'Dialog.vue': `<i :class="['fui-choice focus-visible:fui-focus-ring disabled:fui-disabled', 'aria-disabled:fui-disabled data-disabled:fui-disabled aria-invalid:fui-invalid', props.class]" />`,
    }
    expect(recipeMapProblems(item(files), entry({ choice: 'choice', 'focus-ring': 'focus-ring', disabled: 'disabled', invalid: 'invalid' }))).toEqual([])
  })
})

describe('foreignTreeProblems', () => {
  it('refuses a tree another item owns, past its barrel; families and the item’s own trees pass', () => {
    const trees = new Set(['label-root', 'field-legend'])
    const items = ['field', 'label']
    expect(foreignTreeProblems('field', { label: 'label', legend: 'field-legend', root: 'label-root' }, trees, items)).toEqual([
      'field maps label-root, a tree another item owns; render that item through its barrel',
    ])
    expect(foreignTreeProblems('label', { root: 'label-root', disabled: 'disabled' }, trees, items)).toEqual([])
  })
  it('gives a tree to the longest item name that prefixes it: input never owns input-group’s trees', () => {
    const items = ['input', 'input-group', 'input-otp']
    const trees = new Set(['input', 'input-group', 'input-group-addon', 'input-otp-slot'])
    expect(ownedTrees('input', { default: 'input', group: 'input-group', 'group-addon': 'input-group-addon', 'otp-slot': 'input-otp-slot' }, items)).toEqual(['input'])
    expect(foreignTreeProblems('input', { default: 'input', group: 'input-group', 'group-addon': 'input-group-addon' }, trees, items)).toEqual([
      'input maps input-group, a tree another item owns; render that item through its barrel',
      'input maps input-group-addon, a tree another item owns; render that item through its barrel',
    ])
    expect(ownedTrees('input-group', { default: 'input-group', addon: 'input-group-addon' }, items)).toEqual(['input-group', 'input-group-addon'])
    expect(foreignTreeProblems('input-group', { default: 'input-group', addon: 'input-group-addon', input: 'input' }, trees, items)).toEqual([
      'input-group maps input, a tree another item owns; render that item through its barrel',
    ])
    expect(treeOwner('input-group-addon', items)).toBe('input-group')
    expect(treeOwner('toggle-group', ['toggle', 'toggle-group'])).toBe('toggle-group')
    expect(treeOwner('chip', items)).toBeUndefined()
  })
})

describe('paletteProblems', () => {
  it('refuses colour, radius, shadow, text-style and border utilities outside recipes, behind any variant', () => {
    const text = `<div class="bg-primary hover:text-primary-foreground rounded-md shadow-sm data-open:border-border ring-ring/50 text-sm font-medium border" />`
    expect(paletteProblems('A.vue', text, names)).toHaveLength(9)
  })
  it('skips comments, whose apostrophes would pair with the quotes after them', () => {
    const text = `<script setup lang="ts">\n/** Shows a shopper's cart. */\nimport { ref } from 'vue'\nconst open = ref('closed')\n</script>\n<template><div :class="['flex bg-primary', props.class]"></div></template>`
    expect(paletteProblems('A.vue', text, names)).toEqual(['A.vue: bg-primary styles colour, radius, shadow, text or border outside a recipe'])
  })
  it('reads a class array the way it reads a class string', () => {
    expect(paletteProblems('A.vue', `<i :class="['flex bg-primary', 'rounded-md', props.class]" />`, names)).toEqual([
      'A.vue: bg-primary styles colour, radius, shadow, text or border outside a recipe',
      'A.vue: rounded-md styles colour, radius, shadow, text or border outside a recipe',
    ])
  })
  const cva = (sizes: string, variants = "{ a: 'fui-x' }") => `const b = cva('flex', { variants: { variant: ${variants}, size: ${sizes} }, defaultVariants: { size: 'md' } })`
  it.each(['text-caption', 'rounded-md', 'text-ui', 'rounded', 'md:text-body', '!text-caption'])('refuses %s on a cva size value: sizes are recipes', (token) => {
    expect(paletteProblems('A.vue', cva(`{ xs: '${token}' }`), names)).toEqual([`A.vue: ${token} styles colour, radius, shadow, text or border outside a recipe`])
  })
  it('refuses raw text sizes, weights, line heights and radii anywhere', () => {
    expect(paletteProblems('A.vue', cva("{ xs: 'text-xs font-medium leading-4 rounded-4xl rounded-t-md shadow-sm' }"), names)).toEqual(
      ['text-xs', 'font-medium', 'leading-4', 'rounded-4xl', 'rounded-t-md', 'shadow-sm'].map((t) => `A.vue: ${t} styles colour, radius, shadow, text or border outside a recipe`),
    )
  })
  it('refuses a numeric spacing utility on an element that wears a recipe: its numbers are the recipe’s', () => {
    expect(paletteProblems('A.vue', `<input :class="['fui-input h-9 w-full min-w-0 px-2.5 file:h-7', props.class]" />`, names)).toEqual([
      'A.vue: h-9 sits on an element that wears a recipe; set it in the recipe',
      'A.vue: px-2.5 sits on an element that wears a recipe; set it in the recipe',
    ])
    expect(paletteProblems('A.vue', `const b = cva('fui-badge gap-1 w-fit **:data-icon:size-3', { variants: { size: { sm: 'fui-badge-sm h-5' } } })`, names)).toEqual([
      'A.vue: gap-1 sits on an element that wears a recipe; set it in the recipe',
      'A.vue: **:data-icon:size-3 sits on an element that wears a recipe; set it in the recipe',
      'A.vue: h-5 sits on an element that wears a recipe; set it in the recipe',
    ])
    expect(paletteProblems('A.vue', `<span class="w-4 size-2 p-1 pt-2 py-0.5 min-h-16 gap-x-2 fui-x" />`, names)).toHaveLength(7)
  })
  it.each(['md:h-10', 'hover:px-4', 'data-open:gap-2', '**:data-icon:size-3', '!h-9', 'mt-4', '-mx-2', 'ms-1'])('refuses %s behind any variant on an element that wears a recipe', (token) => {
    expect(paletteProblems('A.vue', `<i class="fui-input ${token}" />`, names)).toEqual([`A.vue: ${token} sits on an element that wears a recipe; set it in the recipe`])
  })
  it('leaves a margin alone on an element without a recipe, and an auto margin anywhere', () => {
    expect(paletteProblems('A.vue', `<div class="mt-4 -mx-2 ms-1"><span class="fui-label ms-auto m-auto" /></div>`, names)).toEqual([])
  })
  it('leaves spacing behind a structural variant alone, but not an icon’s size', () => {
    const tokens = 'has-[>img:first-child]:pt-0 group-has-[>input]/input-group:pt-2.5 [&>span:last-child]:gap-2 has-[>[data-align=block-start]]:[&>input]:pb-3'
    expect(paletteProblems('A.vue', `<i class="fui-input ${tokens}" />`, names)).toEqual([])
    expect(paletteProblems('A.vue', `<i class="fui-input [&_svg]:size-4 [&>[data-icon]]:size-3 *:data-icon:size-3 **:data-icon:h-3" />`, names)).toHaveLength(4)
  })
  it('leaves a child’s margin, a sibling-position margin and a has-data margin alone: no recipe state reaches them', () => {
    const tokens = '*:data-icon:me-1.5 group-has-data-alert-action/alert:me-18 has-data-action:pe-18 first:-ms-0.5 nth-last-2:-mt-1 last:mt-0 only-of-type:pt-2'
    expect(paletteProblems('A.vue', `<i class="fui-input ${tokens}" />`, names)).toEqual([])
    expect(paletteProblems('A.vue', `<i class="fui-input group-data-open:mt-2 data-open:-mt-1 @md:mt-6" />`, names)).toHaveLength(3)
  })
  it('leaves the file selector button’s own height alone: no recipe reaches it', () => {
    expect(paletteProblems('A.vue', `<input class="fui-input file:h-7 file:px-2" />`, names)).toEqual([])
  })
  it('leaves a layout element’s spacing alone', () => {
    expect(paletteProblems('A.vue', `<div class="flex gap-2 p-6"><span class="fui-label" /></div>`, names)).toEqual([])
  })
  it('allows a radius, a border or the shadow taken off, as a joined group meets its neighbours', () => {
    expect(paletteProblems('G.vue', `<div class="*:not-first:rounded-l-none *:not-first:border-l-0 not-last:rounded-b-none rounded-none border-0 shadow-none" />`, names)).toEqual([])
    expect(paletteProblems('G.vue', `<div class="*:not-first:rounded-l-md border-l-2" />`, names)).toHaveLength(2)
  })
  it('allows layout, sizes and non-brand keywords', () => {
    expect(paletteProblems('A.vue', `<div class="flex h-10 text-left bg-transparent ring-2 px-2.5 **:data-icon:size-4" />`, names)).toEqual([])
    expect(paletteProblems('A.vue', `<div class="fui-x w-full w-fit w-auto min-w-0" />`, names)).toEqual([])
  })
})

describe('the registry’s recipes', () => {
  it('leave no two values of different axes to fight over a property: a with pair decides each', () => {
    expect(axisCollisions(readRegistryRecipes(join(import.meta.dirname, '../..')))).toEqual([])
  })
})

describe('itemComposesProblems', () => {
  const flat = { disabled: {}, hint: {} }
  const entry = { title: 'Swatch', description: 'd', recipes: { swatch: { composes: ['disabled'], base: {} }, 'swatch-dot': { base: {} } } }
  const swatch = (files: Record<string, string>): SourceItem => ({ name: 'swatch', tier: 'ui', type: 'registry:ui', files })

  it('passes an element its own tree composes for, or the root tree for a tree-less one', () => {
    expect(itemComposesProblems(swatch({ 'Swatch.vue': '<span class="fui-swatch disabled:fui-disabled" /><i class="disabled:fui-disabled" />' }), entry, flat)).toEqual([])
  })

  it('names each element its tree does not compose for, and leaves the example out', () => {
    const files = { 'Swatch.vue': '<span class="fui-swatch-dot disabled:fui-disabled" /><p class="fui-hint" />', 'swatch.example.vue': '<p class="fui-swatch-dot fui-hint" />' }
    expect(itemComposesProblems(swatch(files), entry, flat)).toEqual([
      'swatch: Swatch.vue: fui-disabled sits on an element of swatch-dot; compose it there: "swatch-dot": { "composes": [..., "disabled"] }',
      'swatch: Swatch.vue: fui-hint sits on an element with no tree of its own, so it answers to swatch; compose it there: "swatch": { "composes": [..., "hint"] }',
    ])
  })
})

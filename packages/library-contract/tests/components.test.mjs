import { describe, expect, it } from 'vitest'
import { classGroups, componentProblems, componentSite, expectedClasses, indexComponents, libraryComponentProblems, readCvas } from '../src/components.mjs'

const button = {
  base: { extends: 'action' },
  variants: {
    variant: { 'brand-primary': { backgroundColor: '{colors.primary}' }, inverse: { backgroundColor: '{colors.background}', with: { size: { lg: { paddingX: '{spacing.3}' } } } } },
    size: { sm: { height: '{spacing.8}' }, lg: { height: '{spacing.10}' } },
  },
  defaults: { variant: 'brand-primary', size: 'sm' },
}
const GOOD = `cva('fui-button inline-flex focus-visible:fui-focus-ring', {
  variants: {
    variant: { 'brand-primary': 'fui-button-brand-primary', inverse: 'fui-button-inverse' },
    size: { sm: 'fui-button-sm', lg: 'fui-button-lg' },
  },
  defaultVariants: { variant: 'brand-primary', size: 'sm' },
})`
const sfc = (cva) => `<script setup lang="ts">\nconst button = ${cva}\n</script>`
const files = (cva, file = 'Button.vue') => ({ [file]: sfc(cva), 'index.ts': '' })

describe('readCvas', () => {
  it('reads every cva call of a file’s script literally, with the line it starts on', () => {
    const [cva] = readCvas(sfc(GOOD))
    expect(cva.base).toBe('fui-button inline-flex focus-visible:fui-focus-ring')
    expect(cva.config.defaultVariants).toEqual({ variant: 'brand-primary', size: 'sm' })
    expect(cva.line).toBe(2)
    expect(readCvas('const a = cva(base(), { variants: v })')).toEqual([{ base: undefined, config: {}, line: 1 }])
    expect(readCvas('<template><i class="fui-x" /></template>')).toEqual([])
  })
})

describe('classGroups', () => {
  it('groups the class tokens per class attribute and per cva call', () => {
    expect(classGroups(`<i :class="['fui-a b', props.class]" /><b class="c" />`)).toEqual([['fui-a', 'b', 'props.class'], ['c']])
    expect(classGroups(`const a = cva('fui-a b', { variants: { size: { sm: 'fui-a-sm' } } })`)).toEqual([['fui-a', 'b', 'fui-a-sm']])
  })

  it('reads a class a prop hands to an element the component renders', () => {
    const [container, own] = classGroups(`<OTPInput :container-class="normalizeClass(['fui-a b', props.class])" class="c" />`)
    expect(container).toEqual(expect.arrayContaining(['fui-a', 'b']))
    expect(own).toEqual(['c'])
    expect(classGroups(`<Popup v-bind:content-class="'fui-a'" :contentClass="'fui-b'" data-class="x" />`)).toEqual([['fui-a'], ['fui-b']])
  })
})

describe('expectedClasses', () => {
  it('names what each cva slot holds; a pair is no slot', () => {
    expect(expectedClasses('button', button)).toEqual({
      base: 'fui-button',
      variants: { variant: { 'brand-primary': 'fui-button-brand-primary', inverse: 'fui-button-inverse' }, size: { sm: 'fui-button-sm', lg: 'fui-button-lg' } },
      defaultVariants: { variant: 'brand-primary', size: 'sm' },
    })
    expect(expectedClasses('rail', { variants: { mode: { a: {} } } })).toEqual({ base: null, variants: { mode: { a: 'fui-rail-a' } }, defaultVariants: {} })
  })
})

describe('componentSite', () => {
  it('finds the file whose cva base holds the tree’s class, else one wearing it, else null', () => {
    expect(componentSite('button', files(GOOD))?.file).toBe('Button.vue')
    expect(componentSite('button', { 'Other.vue': '<i class="fui-button" />' })).toMatchObject({ file: 'Other.vue', cva: null })
    expect(componentSite('button', { 'Other.vue': '<i class="fui-badge" />' })).toBeNull()
  })
  it('finds a tree through a value class when its cva dropped the base class, or the tree has no base', () => {
    const dropped = files(GOOD.replace("'fui-button inline-flex", "'inline-flex"))
    expect(componentSite('button', dropped, { tree: button })).toMatchObject({ file: 'Button.vue' })
    expect(componentSite('button', dropped)).toMatchObject({ file: 'Button.vue' })
    expect(componentProblems('button', button, dropped)).toEqual(['button: the cva base lacks fui-button'])
    const rail = { variants: { mode: { a: {}, b: {} } }, defaults: { mode: 'a' } }
    const site = componentSite('rail', { 'Rail.vue': sfc("cva('flex', { variants: { mode: { a: 'fui-rail-a', b: 'fui-rail-b' } }, defaultVariants: { mode: 'a' } })") })
    expect(site?.file).toBe('Rail.vue')
    expect(componentProblems('rail', rail, { 'Rail.vue': sfc("cva('flex', { variants: { mode: { a: 'fui-rail-a', b: 'h-2' } }, defaultVariants: { mode: 'a' } })") })).toEqual([
      'rail: variants.mode.b holds "h-2"; the tree makes it "fui-rail-b"',
    ])
  })
  it('finds a tree through a value class beside utilities, the base class dropped too', () => {
    const chip = { base: {}, variants: { size: { sm: { height: '{spacing.6}' }, lg: { height: '{spacing.8}' } } }, defaults: { size: 'sm' } }
    const file = { 'Chip.vue': sfc("cva('h-6', { variants: { size: { sm: 'fui-chip-sm h-6', lg: 'h-8 fui-chip-lg' } }, defaultVariants: { size: 'sm' } })") }
    expect(componentSite('chip', file, { tree: chip })?.file).toBe('Chip.vue')
    expect(componentSite('chip', file)?.file).toBe('Chip.vue')
    expect(componentProblems('chip', chip, file)).toEqual([
      'chip: the cva base lacks fui-chip',
      'chip: variants.size.sm holds "fui-chip-sm h-6"; the tree makes it "fui-chip-sm"',
      'chip: variants.size.lg holds "h-8 fui-chip-lg"; the tree makes it "fui-chip-lg"',
    ])
  })
  it('takes a surface axis like any axis', () => {
    const card = { base: { contain: 'inline-size' }, variants: { surface: { raised: {}, bare: { parts: { 'card-header': { paddingX: '{spacing.0}' } } } } }, defaults: { surface: 'raised' } }
    const file = (bare) => ({ 'Card.vue': sfc(`cva('fui-card', { variants: { surface: { raised: 'fui-card-raised', bare: '${bare}' } }, defaultVariants: { surface: 'raised' } })`) })
    expect(componentProblems('card', card, file('fui-card-bare'))).toEqual([])
    expect(componentProblems('card', card, file('fui-card-bare shadow-none'))).toEqual(['card: variants.surface.bare holds "fui-card-bare shadow-none"; the tree makes it "fui-card-bare"'])
  })
  it('reads an index built once in place of the files, and a site handed in', () => {
    const index = indexComponents(files(GOOD))
    expect(componentSite('button', index)?.file).toBe('Button.vue')
    expect(componentProblems('button', button, index)).toEqual([])
    const site = componentSite('button', index)
    expect(componentProblems('button', button, index, { site })).toEqual([])
    expect(componentProblems('button', button, {}, { site: componentSite('button', files(GOOD.replace("sm: 'fui-button-sm'", "sm: 'h-9'"))) })).toEqual([
      'button: variants.size.sm holds "h-9"; the tree makes it "fui-button-sm"',
    ])
  })
  it('takes the main file as the site when named, its first cva standing in for one without the class', () => {
    const site = componentSite('button', files(GOOD.replace("'fui-button inline-flex", "'inline-flex")), { main: 'Button.vue' })
    expect(site?.file).toBe('Button.vue')
    expect(site?.cva?.base).toBe('inline-flex focus-visible:fui-focus-ring')
    expect(componentSite('button', { 'Button.vue': '<i class="x" />' }, { main: 'Button.vue' })).toMatchObject({ file: 'Button.vue', cva: null })
  })
})

describe('componentProblems', () => {
  it('takes a cva that holds exactly the tree’s classes', () => {
    expect(componentProblems('button', button, files(GOOD))).toEqual([])
  })
  it('reports a slot holding a utility or a foreign class', () => {
    expect(componentProblems('button', button, files(GOOD.replace("sm: 'fui-button-sm'", "sm: 'fui-button-sm h-9'")))).toEqual([
      'button: variants.size.sm holds "fui-button-sm h-9"; the tree makes it "fui-button-sm"',
    ])
    expect(componentProblems('button', button, files(GOOD.replace("inverse: 'fui-button-inverse'", "inverse: 'fui-control'")))).toEqual([
      'button: variants.variant.inverse holds "fui-control"; the tree makes it "fui-button-inverse"',
    ])
  })
  it('reports a base without its class, or naming a family or a value', () => {
    expect(componentProblems('button', button, files(GOOD.replace("'fui-button inline-flex", "'inline-flex")), { main: 'Button.vue' })).toEqual(['button: the cva base lacks fui-button'])
    expect(componentProblems('button', button, files(GOOD.replace("'fui-button inline-flex", "'fui-button fui-control fui-button-sm inline-flex")))).toEqual([
      'button: the cva base holds fui-control, which the tree does not put there',
      'button: the cva base holds fui-button-sm, which the tree does not put there',
    ])
  })
  it('reports defaults, axes and values that differ from the tree', () => {
    expect(componentProblems('button', button, files(GOOD.replace("defaultVariants: { variant: 'brand-primary', size: 'sm' }", "defaultVariants: { variant: 'inverse', size: 'sm' }")))).toEqual([
      'button: defaultVariants is {"variant":"inverse","size":"sm"}; the tree’s defaults are {"variant":"brand-primary","size":"sm"}',
    ])
    expect(componentProblems('button', button, files(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg', xl: 'fui-button-xl' ")))).toEqual([
      'button: variants.size.xl is a value the tree does not define',
    ])
    expect(componentProblems('button', button, files(GOOD.replace("size: { sm: 'fui-button-sm', lg: 'fui-button-lg' },", '')))).toEqual(['button: variants.size is missing'])
    expect(componentProblems('button', button, files(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg' }, tone: { a: 'fui-button-a' ")))).toEqual([
      'button: variants.tone is an axis the tree does not define',
    ])
  })
  it('with utilityAxes, a cva axis whose values wear only utilities needs no tree axis; one wearing a recipe class still does', () => {
    const block = files(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg' }, block: { true: 'flex w-full' "))
    expect(componentProblems('button', button, block)).toEqual(['button: variants.block is an axis the tree does not define'])
    expect(componentProblems('button', button, block, { utilityAxes: true })).toEqual([])
    const worn = files(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg' }, block: { true: 'fui-button-block w-full' "))
    expect(componentProblems('button', button, worn, { utilityAxes: true })).toEqual(['button: variants.block is an axis the tree does not define'])
  })
  it('refuses a compoundVariants entry wearing a recipe class: a pair is a rule over its values; one wearing utilities passes', () => {
    const withCompound = (cls) => GOOD.replace('\n  defaultVariants', `\n  compoundVariants: [{ variant: 'inverse', size: 'lg', class: '${cls}' }],\n  defaultVariants`)
    expect(componentProblems('button', button, files(withCompound('fui-button-inverse-lg')))).toEqual([
      'button: compoundVariants { variant: inverse, size: lg } wears fui-button-inverse-lg; a pair is a rule over its values, not a class',
    ])
    expect(componentProblems('button', button, files(withCompound('shadow-lg')))).toEqual([])
  })
  it('reads a component without a cva by its class attribute, and wants one for a tree with axes', () => {
    const input = { base: { height: '{spacing.9}' } }
    const file = (cls) => ({ 'Input.vue': `<template><input :class="['${cls}', props.class]" /></template>` })
    expect(componentProblems('input', input, file('fui-input w-full focus-visible:fui-focus-ring'))).toEqual([])
    expect(componentProblems('input', input, file('w-full'), { main: 'Input.vue' })).toEqual(['input: Input.vue lacks fui-input'])
    expect(componentProblems('input', input, file('w-full'))).toEqual(['input: no file wears fui-input'])
    expect(componentProblems('input', { ...input, variants: { size: { sm: { height: '{spacing.8}' } } } }, file('fui-input'))).toEqual(['input: Input.vue has no cva; its tree has variants'])
  })
  it('reads a part’s tree in the file whose cva holds its class, beside another file’s cva', () => {
    const thumb = { base: { size: '{spacing.4}' }, variants: { size: { sm: { size: '{spacing.3}' } } }, defaults: { size: 'sm' } }
    const SWITCH = `<script setup lang="ts">\nconst root = cva('fui-switch', { variants: { size: { sm: 'fui-switch-sm' } } })\nconst thumb = cva('fui-switch-thumb', { variants: { size: { sm: 'fui-switch-thumb-sm' } }, defaultVariants: { size: 'sm' } })\n</script>`
    expect(componentProblems('switch-thumb', thumb, { 'Switch.vue': SWITCH })).toEqual([])
    expect(componentProblems('switch-thumb', thumb, { 'Switch.vue': SWITCH.replace("sm: 'fui-switch-thumb-sm'", "sm: 'size-3'") })).toEqual([
      'switch-thumb: variants.size.sm holds "size-3"; the tree makes it "fui-switch-thumb-sm"',
    ])
  })
})

describe('libraryComponentProblems', () => {
  const recipes = { flat: { action: { rounded: '{rounded.md}' } }, trees: { button, badge: { base: {} } } }
  it('checks every tree against the file wearing its class, naming the file and the cva’s line; a tree no file wears is no problem', () => {
    const ok = { 'library/components/ui/button/Button.vue': sfc(GOOD) }
    expect(libraryComponentProblems(recipes, ok)).toEqual([])
    const drifted = { 'library/components/ui/button/Button.vue': sfc(GOOD.replace("sm: 'fui-button-sm'", "sm: 'fui-button-sm h-9'")) }
    expect(libraryComponentProblems(recipes, drifted)).toEqual([
      { file: 'library/components/ui/button/Button.vue', line: 2, message: 'button: variants.size.sm holds "fui-button-sm h-9"; the tree makes it "fui-button-sm"' },
    ])
  })
  it('lets a cva axis of utilities alone, as a project’s layout prop', () => {
    const block = { 'library/components/ui/button/Button.vue': sfc(GOOD.replace("lg: 'fui-button-lg' ", "lg: 'fui-button-lg' }, block: { true: 'flex w-full' ")) }
    expect(libraryComponentProblems(recipes, block)).toEqual([])
  })
  it('reports a cva that dropped its base class, found through a value class', () => {
    expect(libraryComponentProblems(recipes, { 'library/components/ui/button/Button.vue': sfc(GOOD.replace("'fui-button inline-flex", "'inline-flex")) })).toEqual([
      { file: 'library/components/ui/button/Button.vue', line: 2, message: 'button: the cva base lacks fui-button' },
    ])
  })
  it('reports a file wearing a tree’s class without the cva its axes need, at line 1', () => {
    expect(libraryComponentProblems(recipes, { 'library/components/ui/button/Button.vue': '<template><i class="fui-button" /></template>' })).toEqual([
      { file: 'library/components/ui/button/Button.vue', line: 1, message: 'button: Button.vue has no cva; its tree has variants' },
    ])
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderBaseCss, recipeTokenProblems, stylePresetPath } from '../src/brand.mjs'
import { composesProblems } from '../src/components.mjs'
import { recipeContrastProblems } from '../src/contrast.mjs'
import { recipeMap } from '../src/item.mjs'
import { axisCollisions, designProblems, designWarnings, isTree, composesOf, orderedTree, readRecipeFiles, treeOrderProblems, treeProblems } from '../src/recipe.mjs'

const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
const flat = { 'focus-ring': { outlineColor: '{colors.ring}' }, disabled: { opacity: '{opacity.50}' }, hint: { textColor: '{colors.muted-foreground}' } }
const accordion = {
  base: { display: 'flex' },
  variants: { size: { sm: { gap: '{spacing.2}' }, lg: { gap: '{spacing.4}' } } },
  defaults: { size: 'sm' },
}

describe('a tree’s own composes', () => {
  it('is a tree key the contract accepts, naming shared recipes', () => {
    expect(treeProblems('accordion', { composes: ['focus-ring'], ...accordion }, flat)).toEqual([])
    expect(designProblems({ flat, trees: { accordion: { composes: ['focus-ring', 'disabled'], ...accordion } } })).toEqual([])
  })

  it('refuses a composes that is not a list of recipe names, each once', () => {
    expect(treeProblems('accordion', { composes: [], ...accordion }, flat)).toEqual(['accordion.composes: lists shared recipe names, and is left out when empty'])
    expect(treeProblems('accordion', { composes: 'focus-ring', ...accordion }, flat)).toEqual(['accordion.composes: lists shared recipe names, and is left out when empty'])
    expect(treeProblems('accordion', { composes: ['Focus', 'disabled', 'disabled'], ...accordion }, flat)).toEqual([
      'accordion.composes: Focus is not a recipe name: lowercase letters, digits and dashes',
      'accordion.composes: disabled is listed twice',
    ])
  })

  it('refuses a name that is not a shared recipe: missing, or a tree', () => {
    expect(designProblems({ flat, trees: { accordion: { composes: ['ring', 'badge'], ...accordion }, badge: { base: {} } } })).toEqual([
      'accordion.composes: ring is not a shared recipe',
      'accordion.composes: badge is not a shared recipe',
    ])
  })

  it('renders nothing and changes no check', () => {
    const without = { flat, trees: { accordion } }
    const withComposes = { flat, trees: { accordion: { composes: ['focus-ring'], ...accordion } } }
    expect(renderBaseCss(brand, withComposes)).toBe(renderBaseCss(brand, without))
    expect(designWarnings(withComposes)).toEqual(designWarnings(without))
    expect(recipeTokenProblems(withComposes, brand)).toEqual(recipeTokenProblems(without, brand))
    expect(recipeContrastProblems(withComposes, brand)).toEqual(recipeContrastProblems(without, brand))
    expect(axisCollisions(withComposes)).toEqual(axisCollisions(without))
  })
})

describe('a tree holding only composes', () => {
  const footer = { composes: ['hint', 'focus-ring'] }

  it('is a tree, reads as one from a recipe file, and passes the contract', () => {
    expect(isTree(footer)).toBe(true)
    expect(readRecipeFiles([{ path: 'components/sections/footer/footer.json', text: JSON.stringify({ footer }) }]).trees).toEqual({ footer })
    expect(designProblems({ flat, trees: { footer } })).toEqual([])
  })

  it('renders nothing: no utility, the stylesheet byte for byte as without it', () => {
    const css = renderBaseCss(brand, { flat, trees: { footer } })
    expect(css).toBe(renderBaseCss(brand, { flat, trees: {} }))
    expect(css).not.toContain('fui-footer')
  })

  it('is no part of the item’s recipe map, while what it composes is', () => {
    expect(recipeMap({ name: 'footer', recipes: { footer, 'footer-link': { composes: ['disabled'], base: {} } } })).toEqual({
      link: 'footer-link',
      hint: 'hint',
      'focus-ring': 'focus-ring',
      disabled: 'disabled',
    })
  })
})

describe('composesOf', () => {
  it('is the union of the trees’ composes in tree order, then a stored item’s top-level list, each once', () => {
    const recipes = { card: { composes: ['focus-ring'], base: {} }, 'card-title': { composes: ['hint', 'focus-ring'], base: {} }, 'card-body': { base: {} } }
    expect(composesOf({ recipes })).toEqual(['focus-ring', 'hint'])
    expect(composesOf({ recipes, composes: ['disabled', 'hint'] })).toEqual(['focus-ring', 'hint', 'disabled'])
    expect(composesOf({})).toEqual([])
  })
})

describe('tree key order', () => {
  it('runs composes, base, variants, defaults, keepAxis, and reports a tree out of it', () => {
    expect(treeOrderProblems({ a: { composes: ['x'], base: {}, variants: {}, defaults: {}, keepAxis: [] }, b: { base: {} } })).toEqual([])
    expect(treeOrderProblems({ a: { base: {}, composes: ['x'] } })).toEqual(['a: keys run base, composes; a tree orders them composes, base'])
    expect(Object.keys(orderedTree({ defaults: {}, base: {}, composes: ['x'], mine: 1 }))).toEqual(['composes', 'base', 'defaults', 'mine'])
  })
})

describe('composesProblems', () => {
  const recipes = {
    swatch: { composes: ['disabled'], base: {}, variants: { size: { sm: {} } } },
    'swatch-dot': { composes: ['focus-ring'], base: {} },
  }
  const ok = { 'Swatch.vue': `const swatch = cva('fui-swatch disabled:fui-disabled', { variants: { size: { sm: 'fui-swatch-sm' } } })\n<span class="fui-swatch-dot focus-visible:fui-focus-ring" />` }

  it('passes an element whose own tree composes what it wears, and a tree-less element its root tree composes', () => {
    expect(composesProblems('swatch', recipes, ok, flat)).toEqual([])
    expect(composesProblems('swatch', { ...recipes, swatch: { ...recipes.swatch, composes: ['disabled', 'hint'] } }, { 'Label.vue': '<p class="fui-hint" />' }, flat)).toEqual([])
  })

  it('names an element whose own tree does not compose it, even when the root tree does', () => {
    const files = { 'Swatch.vue': '<span class="fui-swatch-dot disabled:fui-disabled" />' }
    expect(composesProblems('swatch', recipes, files, flat)).toEqual(['Swatch.vue: fui-disabled sits on an element of swatch-dot; compose it there: "swatch-dot": { "composes": [..., "disabled"] }'])
  })

  it('names a tree-less element its root tree does not compose', () => {
    expect(composesProblems('swatch', recipes, { 'Label.vue': '<p class="fui-hint" />' }, flat)).toEqual([
      'Label.vue: fui-hint sits on an element with no tree of its own, so it answers to swatch; compose it there: "swatch": { "composes": [..., "hint"] }',
    ])
  })
})

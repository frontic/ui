import { describe, expect, it } from 'vitest'
import { recipeClasses, recipeClassProblems, recipeFiles, recipeMap } from '../src/item.mjs'

const UI = 'components/ui/dialog'
const dialog = (shape) => ({
  items: [
    {
      name: 'dialog',
      type: 'registry:ui',
      files: [
        { path: `${UI}/Dialog.vue`, type: 'registry:ui' },
        { path: `${UI}/DialogContent.vue`, type: 'registry:ui' },
        { path: `${UI}/dialog.example.vue`, type: 'registry:example' },
      ],
      ...shape,
    },
  ],
})

describe('recipeClasses', () => {
  it('reads whole recipe classes once, in order, bare or behind a variant', () => {
    expect(recipeClasses('<div class="fui-overlay-modal focus-visible:fui-focus-ring my-fui-x" :class="`fui-${tone}`" />')).toEqual(['overlay-modal', 'focus-ring'])
  })
})

const TREE = { base: 'x' }

describe('recipeMap', () => {
  it('maps the tree named after the item to default, each <item>-<part> tree to its part and each composed recipe to itself', () => {
    const recipes = { dialog: TREE, 'dialog-content': { variants: {} }, 'dialog-close': { keepAxis: [] }, overlay: TREE, 'part-title': {} }
    expect(recipeMap({ name: 'dialog', recipes, composes: ['focus-ring'] })).toEqual({ default: 'dialog', content: 'dialog-content', close: 'dialog-close', 'focus-ring': 'focus-ring' })
  })

  it('ignores meta.frontic.recipes', () => {
    const meta = { frontic: { recipes: { default: 'dialog', 'focus-ring': 'focus-ring' } } }
    expect(recipeMap({ name: 'dialog', recipes: { dialog: TREE }, meta })).toEqual({ default: 'dialog' })
  })
})

describe('recipeFiles', () => {
  it('names every file of an item but its examples', () => {
    expect(recipeFiles(dialog({}).items[0])).toEqual([`${UI}/Dialog.vue`, `${UI}/DialogContent.vue`])
  })
})

describe('recipeClassProblems', () => {
  const texts = {
    [`${UI}/Dialog.vue`]: '<template><slot /></template>',
    [`${UI}/DialogContent.vue`]: '<div class="fui-overlay-modal" />',
    [`${UI}/dialog.example.vue`]: '<p class="fui-part-title" />',
  }

  it('finds a composed recipe in a sub-file', () => {
    expect(recipeClassProblems(dialog({ composes: ['overlay-modal'] }), texts)).toEqual([])
  })

  it('reads own trees and composed recipes, not meta', () => {
    expect(recipeClassProblems(dialog({ recipes: { dialog: TREE }, composes: ['part-title'] }), texts)).toEqual([
      { path: 'items[0].recipes', message: 'dialog has the recipe "dialog", but none of its files has a fui-dialog class' },
      { path: 'items[0].recipes', message: 'dialog has the recipe "part-title", but none of its files has a fui-part-title class' },
    ])
  })

  it('reports a missing recipe once when two keys map to it', () => {
    expect(recipeClassProblems(dialog({ recipes: { dialog: TREE }, composes: ['dialog'] }), texts)).toHaveLength(1)
  })

  it('skips an item none of whose files it was given', () => {
    expect(recipeClassProblems(dialog({ composes: ['part-title'] }), {})).toEqual([])
  })
})

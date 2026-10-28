// @vitest-environment happy-dom
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { RECIPE_STATES } from '@frontic/library-contract/recipe'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { Checkbox } from '../../ui/checkbox'

const icon = async (modelValue: boolean | 'indeterminate') => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(Checkbox, { modelValue }))
  return host.querySelector('[data-icon]')!.getAttribute('class') ?? ''
}

describe('a Checkbox', () => {
  it('draws a minus when indeterminate and a check when checked', async () => {
    expect(await icon('indeterminate')).toMatch(/minus/)
    expect(await icon(true)).toMatch(/check/)
  })

  it('fills an indeterminate box like a checked one', () => {
    expect(RECIPE_STATES.checked).toContain('[data-state=indeterminate]')
    expect(RECIPE_STATES.checked).toContain('[aria-checked=mixed]')
  })

  it('sizes its icon in the recipe, not with a class', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Checkbox, { modelValue: true }))
    expect(host.querySelector('[data-slot="checkbox-indicator"]')!.className).not.toMatch(/size-/)
    expect(readRegistryRecipes(join(import.meta.dirname, '../..')).trees.checkbox!.base).toMatchObject({ icon: { size: '{spacing.3.5}' } })
  })
})

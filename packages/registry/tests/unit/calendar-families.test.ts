import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
const extendsOf = (tree: string) => [(trees[tree] as { base?: { extends?: string | string[] } }).base?.extends ?? []].flat()

describe('calendar and range-calendar', () => {
  it('take their shared look from the same families, so a change to one reaches the other', () => {
    for (const [part, family] of [
      ['nav', 'calendar-nav-button'],
      ['head-cell', 'calendar-weekday'],
      ['heading', 'calendar-month'],
      ['cell-trigger', 'calendar-day'],
    ])
      for (const item of ['calendar', 'range-calendar']) expect(extendsOf(`${item}-${part}`), `${item}-${part}`).toContain(family)
  })
})

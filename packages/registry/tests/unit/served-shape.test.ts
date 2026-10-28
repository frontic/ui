import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { recipeMap } from '@frontic/library-contract/item'
import { composesOf, isTree, treeOwner, type ComponentTree } from '@frontic/library-contract/recipe'
import { afterAll, describe, expect, it } from 'vitest'
import { buildRegistry } from '../../scripts/build'
import { usedFamilies } from '../../scripts/lib/served'

describe('every served item', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'served-shape-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  const served = await buildRegistry({ out: join(dir, 'v1') })
  const names = served.map((item) => item.name)

  it.each(served.map((item) => [item.name, item] as const))(
    '%s serves its own trees with what each composes, each library recipe they need under library.recipes, no shared and no top-level composes',
    (name, item) => {
      expect(item).not.toHaveProperty('meta')
      for (const tree of Object.keys(item.recipes)) {
        expect(isTree(item.recipes[tree]), tree).toBe(true)
        expect(treeOwner(tree, names), tree).toBe(name)
      }
      expect(item).not.toHaveProperty('shared')
      expect(item).not.toHaveProperty('composes')
      const families = Object.values(item.recipes).flatMap((tree) => usedFamilies(tree as ComponentTree))
      expect(Object.keys(item.library?.recipes ?? {}).sort()).toEqual([...new Set([...composesOf(item), ...families])].filter((r) => !Object.hasOwn(item.recipes, r)).sort())
      for (const recipe of Object.values(recipeMap(item))) expect(Object.hasOwn({ ...item.recipes, ...item.library?.recipes }, recipe), recipe).toBe(true)
    },
  )
})

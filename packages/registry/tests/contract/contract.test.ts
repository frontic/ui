import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readSourceItems } from '../../scripts/lib/items'
import { servedItem, type AuthoredEntry } from '../../scripts/lib/served'
import { servedFiles } from '../../scripts/lib/served-files'
import { runContract } from '../../scripts/contract'

// Under the package, so vue-tsc resolves vue and the items' packages from its node_modules.
const scratch = join(import.meta.dirname, '../../.contract/test')
rmSync(scratch, { recursive: true, force: true })
mkdirSync(scratch, { recursive: true })
afterAll(() => rmSync(scratch, { recursive: true, force: true }))
const recipes = {
  flat: { pill: { rounded: '{rounded.full}' }, ghost: { textColor: '{colors.foreground}' } },
  trees: {
    badge: {
      base: { extends: 'pill', backgroundColor: '{colors.primary}', textColor: '{colors.primary-foreground}', hover: { opacity: '{opacity.90}' } },
      variants: { variant: { default: { borderColor: 'transparent' }, outline: { borderColor: '{colors.border}' } } },
      defaults: { variant: 'default' },
    },
  },
}
const badge = (composes?: string[]): AuthoredEntry => ({ name: 'badge', recipes: { badge: composes ? { composes, ...recipes.trees.badge } : recipes.trees.badge } })
const served = (fixture: string, entry = badge()) =>
  Promise.all(
    readSourceItems(join(import.meta.dirname, 'fixtures', fixture)).map(async (item) =>
      servedItem({ ...item, files: await servedFiles(item) }, entry, { ...recipes, trees: { ...recipes.trees, ...entry.recipes } }),
    ),
  )
const run = async (items: Awaited<ReturnType<typeof served>>) => runContract({ served: items, dir: mkdtempSync(join(scratch, 'test-')) })

describe('runContract', () => {
  it('passes an item the stack would save', async () => {
    expect((await run(await served('good'))).blocking).toEqual([])
  })

  it('blocks a stock palette class and a type error, naming the library file', async () => {
    const { blocking } = await run(await served('bad'))
    expect(blocking.map((p) => p.ruleId)).toEqual(expect.arrayContaining(['better-tailwindcss/no-unknown-classes', expect.stringMatching(/^TS\d+$/)]))
    expect(blocking).toContainEqual(expect.objectContaining({ ruleId: 'library/fui-classes', file: 'library/registry.json' }))
    expect(blocking.filter((p) => p.file !== 'library/registry.json').every((p) => p.file.startsWith('library/components/ui/badge/'))).toBe(true)
  })

  it('blocks a composed recipe none of the item’s files uses', async () => {
    const { blocking } = await run(await served('good', badge(['ghost'])))
    expect(blocking).toEqual([expect.objectContaining({ ruleId: 'library/fui-classes', message: expect.stringContaining('fui-ghost') })])
  })

  it('blocks a served recipe colour below its contrast threshold on every shipped preset', async () => {
    const items = await served('good')
    items[0]!.recipes = { ...items[0]!.recipes, badge: { ...recipes.trees.badge, base: { ...recipes.trees.badge.base, textColor: '{colors.primary}' } } }
    const { blocking } = await run(items)
    const lines = blocking.filter((p) => p.ruleId === 'library/contrast')
    expect(lines.map((p) => p.message.split(':')[0])).toEqual(['default', 'basecamp-style'])
    expect(lines[0]).toMatchObject({ file: 'library/recipes/badge.json', message: expect.stringContaining('badge.base: text {colors.primary} on {colors.primary} is 1:1, needs 4.5:1') })
  })

  it('blocks an import of a library item the registry does not list, naming the file', async () => {
    const items = await served('good')
    const badge = items[0]!.files.find((f) => f.path.endsWith('Badge.vue'))!
    badge.content = badge.content.replace('import { cva }', "import { Ghost } from '@library/components/ui/ghost'\nimport { cva }")
    const { blocking } = await run(items)
    expect(blocking).toContainEqual(expect.objectContaining({ ruleId: 'library/dependencies', file: 'library/components/ui/badge/Badge.vue', message: expect.stringContaining('ui/ghost') }))
  })
})

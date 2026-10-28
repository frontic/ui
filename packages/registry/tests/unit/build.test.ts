import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registryJsonSchema } from '../../scripts/lib/registry-schema'
import { recipeJsonSchema } from '@frontic/library-contract/recipe-schema'
import { buildRegistry, OUT } from '../../scripts/build'

const BADGE = { base: { extends: 'pill' }, variants: { variant: { primary: { backgroundColor: '{colors.primary}', hover: { opacity: '{opacity.90}' } } } } }

/** Sets the badge manifest's tree, or drops its recipes. */
function badgeRecipes(root: string, tree: Record<string, unknown> | undefined) {
  const path = join(root, 'ui/badge/badge.json')
  const { recipes: _recipes, ...manifest } = JSON.parse(readFileSync(path, 'utf8'))
  writeFileSync(path, JSON.stringify(tree ? { ...manifest, recipes: { badge: tree } } : manifest))
}

function fixture(pending: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'registry-'))
  const write = (path: string, text: string) => {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  write(
    'ui/badge/Badge.vue',
    '<script setup lang="ts">\nimport { IconPlaceholder } from \'@registry/icon-placeholder\'\n</script>\n\n<template>\n  <span class="fui-badge fui-badge-primary"><IconPlaceholder lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" /></span>\n</template>\n',
  )
  write('ui/badge/index.ts', "export { default as Badge } from './Badge.vue'")
  write('ui/badge/badge.example.vue', '<template />')
  write('ui/card/Card.vue', '<template />')
  write('ui/badge/badge.json', JSON.stringify({ title: 'Badge', recipes: { badge: BADGE } }))
  write('ui/card/card.json', JSON.stringify({}))
  write('pending.json', JSON.stringify({ items: pending }))
  write('recipes/shared/pill.json', JSON.stringify({ pill: { rounded: '{rounded.full}' } }))
  write('recipes/shared/unused.json', JSON.stringify({ unused: { textColor: '{colors.foreground}' } }))
  write('icons/legacy-mapping.json', '{}')
  write('families.json', JSON.stringify({ groups: [{ group: 'pill', title: 'Pill', families: ['pill', 'unused'] }] }))
  return root
}
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

describe('buildRegistry', () => {
  it('writes the contract into public/v1/ by default, and nothing of /r/', async () => {
    const root = fixture(['card'])
    const out = join(root, 'public/v1')
    await buildRegistry({ root, out })
    expect(read(join(out, 'index.json'))).toEqual({ items: [{ name: 'badge', type: 'registry:ui', title: 'Badge', parts: ['Badge'] }] })
    const badge = read(join(out, 'badge.json'))
    expect(badge.files.map((f: { path: string; type: string }) => [f.path, f.type])).toEqual([
      ['components/ui/badge/Badge.vue', 'registry:ui'],
      ['components/ui/badge/badge.example.vue', 'registry:example'],
      ['components/ui/badge/index.ts', 'registry:ui'],
    ])
    expect(badge.files[0].content).toContain('<CheckIcon />')
    expect(badge.files[0].content).not.toContain('IconPlaceholder')
    expect(badge.dependencies).toEqual(['@lucide/vue'])
    expect(badge).not.toHaveProperty('meta')
    expect(badge.api.install).toBe('npx @frontic/ui add badge')
    expect(badge.api.parts.map((part: { name: string }) => part.name)).toEqual(['Badge'])
    expect(existsSync(join(out, 'badge.md'))).toBe(false)
    expect(badge.recipes).toEqual({
      badge: { base: { extends: 'pill' }, variants: { variant: { primary: { backgroundColor: '{colors.primary}', hover: { opacity: '{opacity.90}' } } } } },
    })
    expect(badge.library).toEqual({ recipes: { pill: { rounded: '{rounded.full}' } } })
    expect(badge).not.toHaveProperty('shared')
    const registry = read(join(out, 'registry.json'))
    expect(registry.items[0]).not.toHaveProperty('library')
    expect(registry.items[0].files[0]).toEqual({ path: 'components/ui/badge/Badge.vue', type: 'registry:ui' })
    expect(existsSync(join(out, 'card.json'))).toBe(false)
    expect(read(join(root, 'public/recipe.schema.json'))).toEqual(recipeJsonSchema())
    expect(read(join(root, 'public/item.schema.json'))).toEqual(read(join(import.meta.dirname, '../../item.schema.json')))
    expect(read(join(root, 'public/registry.schema.json'))).toEqual(registryJsonSchema())
    expect(read(join(out, 'icons/index.json'))).toEqual({ CheckIcon: { lucide: 'CheckIcon', tabler: 'IconCheck', hugeicons: 'Tick02Icon', phosphor: 'PhCheck', remixicon: 'RiCheckLine' } })
  }, 30_000)

  it('refuses a build whose served files import an unmapped icon', async () => {
    const root = fixture(['card'])
    writeFileSync(
      join(root, 'ui/badge/badge.example.vue'),
      '<script setup lang="ts">\nimport { NotMappedIcon } from \'@lucide/vue\'\n</script>\n\n<template>\n  <component :is="NotMappedIcon" />\n</template>\n',
    )
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow('NotMappedIcon is imported from @lucide/vue in components/ui/badge/badge.example.vue')
  }, 30_000)

  it('refuses a generic recipe that does not reference a token', async () => {
    const root = fixture(['card'])
    badgeRecipes(root, { variants: { variant: { primary: { backgroundColor: '#ff0000' } } } })
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow(/#ff0000 — backgroundColor takes \{colors/)
  }, 30_000)

  it('refuses a recipe file that sits where its owner does not say', async () => {
    const root = fixture(['card'])
    badgeRecipes(root, undefined)
    writeFileSync(join(root, 'recipes/shared/badge.json'), JSON.stringify({ badge: { base: { extends: 'pill' } } }))
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow('recipe files:\nrecipes/shared/badge.json: badge is a tree; a tree sits in the manifest of the item that maps it')
  }, 30_000)

  it('refuses a tree the contract refuses', async () => {
    const root = fixture(['card'])
    badgeRecipes(root, { base: { extends: 'ghost' } })
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow('badge.base.extends: ghost is not a flat recipe')
  }, 30_000)

  it('refuses a source item without a manifest', async () => {
    const root = fixture(['card'])
    rmSync(join(root, 'ui/badge/badge.json'))
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow('badge has no manifest ui/badge/badge.json')
  }, 30_000)

  it('writes /v1/ beside public/r/v2/ and leaves that frozen copy as it was, as the deploy builds and ships public/', async () => {
    expect(OUT.endsWith(join('registry', 'public', 'v1'))).toBe(true)
    const root = fixture(['card'])
    const frozen = join(root, 'public/r/v2/badge.json')
    mkdirSync(join(frozen, '..'), { recursive: true })
    writeFileSync(frozen, '{ "frozen": true }\n')
    await buildRegistry({ root, out: join(root, 'public/v1') })
    expect(readFileSync(frozen, 'utf8')).toBe('{ "frozen": true }\n')
    expect(existsSync(join(root, 'public/v1/badge.json'))).toBe(true)
  }, 30_000)

  it('refuses a manifest or a pending name without a source', async () => {
    const root = fixture(['card'])
    mkdirSync(join(root, 'lib'))
    writeFileSync(join(root, 'lib/ghost.json'), JSON.stringify({}))
    await expect(buildRegistry({ root, out: join(root, 'o') })).rejects.toThrow('lib/ghost.json: a manifest for no item; lib/<name>.json sits beside lib/<name>.ts')
    const other = fixture(['card', 'nope'])
    await expect(buildRegistry({ root: other, out: join(other, 'o') })).rejects.toThrow('nope is listed but has no source under ui/, sections/, templates/, lib/ or composables/')
  }, 30_000)

  it('writes into public/v1/ when no out is named, the path the registry serves', () => {
    expect(OUT).toBe(join(import.meta.dirname, '../../public/v1'))
  })

  it('writes the recipe schema at the registry root, wherever the served files go', async () => {
    const root = fixture(['card'])
    await buildRegistry({ root, out: join(root, 'elsewhere/deep') })
    expect(read(join(root, 'public/recipe.schema.json'))).toEqual(recipeJsonSchema())
    expect(existsSync(join(root, 'elsewhere/recipe.schema.json'))).toBe(false)
  }, 30_000)
})

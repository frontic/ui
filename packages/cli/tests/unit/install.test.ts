import { REGISTRY_URL } from '@frontic/registry-client'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addDependency } from 'nypm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installItems } from '@/src/install'
import { itemManifestText, recipeFileText } from '@frontic/library-contract/recipe'
import { defaultBrand, readRecipes } from '@/src/library'
import { getConfig } from '@/src/utils/get-config'
import { logger } from '@/src/utils/logger'

vi.mock('nypm', () => ({ addDependency: vi.fn(async () => {}), detectPackageManager: vi.fn(async () => null) }))

const vue = (name: string, icon = false) =>
  [
    '<script setup lang="ts">',
    ...(icon ? ["import { CheckIcon } from '@lucide/vue'"] : []),
    "import { Button } from '@library/components/ui/button'",
    '</script>',
    '<template>',
    `  <Button class="fui-${name}">${icon ? '<CheckIcon data-icon />' : ''}</Button>`,
    '</template>',
    '',
  ].join('\n')

const registry = {
  button: {
    name: 'button',
    type: 'registry:ui',
    dependencies: ['reka-ui', 'class-variance-authority'],
    files: [
      { path: 'components/ui/button/Button.vue', type: 'registry:ui', content: '<template><button class="fui-button" /></template>\n' },
      { path: 'components/ui/button/button.example.vue', type: 'registry:example', content: '<template><Button /></template>\n' },
      { path: 'components/ui/button/index.ts', type: 'registry:ui', content: "export { default as Button } from './Button.vue'\n" },
    ],
    recipes: {
      button: { base: { extends: 'action' }, variants: { variant: { solid: { backgroundColor: '{colors.primary}' } } }, defaults: { variant: 'solid' } },
    },
    library: { recipes: { action: { rounded: '{rounded.md}' } } },
  },
  card: {
    name: 'card',
    type: 'registry:ui',
    dependencies: ['reka-ui', '@lucide/vue'],
    registryDependencies: ['button'],
    files: [
      { path: 'components/ui/card/Card.vue', type: 'registry:ui', content: vue('card', true) },
      { path: 'components/ui/card/card.example.vue', type: 'registry:example', content: '<template><Card /></template>\n' },
    ],
    recipes: { card: { base: { borderColor: '{colors.border}' } } },
  },
  hero: {
    name: 'hero',
    type: 'registry:component',
    registryDependencies: ['button'],
    files: [{ path: 'components/sections/hero/Hero.vue', type: 'registry:component', content: vue('hero') }],
    recipes: { hero: { base: { paddingY: '{spacing.8}' } } },
  },
}
const icons = { CheckIcon: { lucide: 'CheckIcon', tabler: 'IconCheck', hugeicons: 'Tick02Icon', phosphor: 'PhCheck', remixicon: 'RiCheckLine' } }

let cwd: string
const DESIGN = '---\nname: Shop\n---\nMy notes.\n'

beforeEach(async () => {
  vi.stubEnv('FRONTIC_SKIP_INSTALL', '1')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === `${REGISTRY_URL}/icons/index.json`) return new Response(JSON.stringify(icons))
      const name = url.slice(REGISTRY_URL.length + 1, -'.json'.length)
      return name in registry ? new Response(JSON.stringify(registry[name as keyof typeof registry])) : new Response('{}', { status: 404 })
    }),
  )
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-install-'))
  await writeFile(join(cwd, 'package.json'), '{ "name": "shop" }')
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./app/*'] } } }))
  await writeFile(
    join(cwd, 'components.json'),
    JSON.stringify({ style: 'bare', tailwind: { css: 'app/assets/tailwind.css' }, iconLibrary: 'tabler', aliases: { components: '@/components', ui: '@/components/ui' } }),
  )
  await mkdir(join(cwd, 'library'))
  await writeFile(join(cwd, 'library/brand.json'), defaultBrand())
  await mkdir(join(cwd, 'library/recipes'), { recursive: true })
  await writeFile(join(cwd, 'library/recipes/action.json'), recipeFileText({ action: { rounded: '{rounded.full}' } }))
  await writeFile(join(cwd, 'library/DESIGN.md'), DESIGN)
})

afterEach(async () => {
  vi.mocked(addDependency).mockReset()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(cwd, { recursive: true, force: true })
})

describe('installItems', () => {
  it('refuses a project without brand.json before writing anything, pointing at init --force', async () => {
    await rm(join(cwd, 'library/brand.json'))
    const config = (await getConfig(cwd))!
    const design = await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')

    await expect(installItems(['button'], config)).rejects.toThrow(/brand\.json.*init --force/)

    expect(existsSync(join(cwd, 'app/components/ui/button'))).toBe(false)
    expect(await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')).toBe(design)
    expect(existsSync(join(cwd, 'app/components/ui/button/button.json'))).toBe(false)
  })

  it('says the items are installed and frontic.css was not rebuilt when the brand lacks a token a new recipe names', async () => {
    const brand = JSON.parse(defaultBrand().replaceAll('{color.edge.border}', '{color.edge.input}'))
    delete brand.color.edge.border
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    const config = (await getConfig(cwd))!

    await expect(installItems(['card'], config, { silent: true })).rejects.toThrow(
      'Installed button, card, but frontic.css was not rebuilt:\napp/components/ui/card/card.json: card.base.borderColor: {colors.border} is not in library/brand.json\nFix it, then run build.',
    )
    expect(existsSync(join(cwd, 'app/components/ui/card/Card.vue'))).toBe(true)
  })

  it('still rebuilds frontic.css with the new recipes when the font install fails', async () => {
    vi.stubEnv('FRONTIC_SKIP_INSTALL', '')
    vi.mocked(addDependency).mockImplementation(async (packages) => {
      if ([packages].flat().some((name) => name.startsWith('@fontsource'))) throw new Error('network unreachable')
      return undefined as never
    })
    const config = (await getConfig(cwd))!

    const report = await installItems(['button'], config, { silent: true })

    expect(report.stylesheet.written).toBe(true)
    const css = await readFile(report.stylesheet.path, 'utf8')
    expect(css).toContain('fui-button')
    expect(css).not.toContain('@import')
  })

  it('installs the closure without demos, on the project aliases and icon library, merges the recipes and compiles', async () => {
    const config = (await getConfig(cwd))!
    const report = await installItems(['card', 'hero'], config, { silent: true })

    expect(report.items).toEqual(['button', 'card', 'hero'])
    expect(report.files.filesCreated).toEqual(['app/components/ui/button/Button.vue', 'app/components/ui/button/index.ts', 'app/components/ui/card/Card.vue', 'app/components/sections/hero/Hero.vue'])
    expect(existsSync(join(cwd, 'app/components/ui/button/button.example.vue'))).toBe(false)
    expect(report.dependencies).toEqual(['reka-ui', 'class-variance-authority', '@tabler/icons-vue'])

    const card = await readFile(join(cwd, 'app/components/ui/card/Card.vue'), 'utf8')
    expect(card).toContain("import { IconCheck } from '@tabler/icons-vue'")
    expect(card).toContain("import { Button } from '@/components/ui/button'")
    expect(card).toContain('<IconCheck data-icon />')

    expect(report.recipes).toEqual({
      added: [
        { name: 'button', file: 'app/components/ui/button/button.json' },
        { name: 'card', file: 'app/components/ui/card/card.json' },
        { name: 'hero', file: 'app/components/sections/hero/hero.json' },
      ],
      replaced: [],
      kept: [{ name: 'action', file: 'library/recipes/action.json' }],
    })
    const recipes = await readRecipes(config)
    expect(recipes.paths).toEqual({
      button: 'app/components/ui/button/button.json',
      card: 'app/components/ui/card/card.json',
      hero: 'app/components/sections/hero/hero.json',
      action: 'library/recipes/action.json',
    })
    expect(recipes.flat.action).toEqual({ rounded: '{rounded.full}' })
    expect(await readFile(join(cwd, 'app/components/ui/card/card.json'), 'utf8')).toBe(itemManifestText({ recipes: { card: { base: { borderColor: '{colors.border}' } } } }))
    expect(report.files.filesCreated).not.toContain('app/components/ui/card/card.json')
    expect(await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')).toBe(DESIGN)

    expect(report.stylesheet).toEqual({ written: true, path: join(cwd, 'app/assets/frontic.css'), warnings: [] })
    const css = await readFile(report.stylesheet.path, 'utf8')
    expect(css).toContain('@utility fui-button')
    expect(css).toContain('@utility fui-card')
  })

  it('reports an untyped property a project recipe file sets as a warning naming the file, and still compiles', async () => {
    await writeFile(join(cwd, 'library/recipes/action.json'), recipeFileText({ action: { cursor: 'pointer' } }))
    const config = (await getConfig(cwd))!
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const report = await installItems(['button'], config, { silent: false, yes: true })
      expect(report.stylesheet?.written).toBe(true)
      expect(warn).toHaveBeenCalledWith('library/recipes/action.json: action.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value')
    } finally {
      warn.mockRestore()
    }
  })

  it('keeps installed files and edited recipes, and replaces both with overwrite', async () => {
    const config = (await getConfig(cwd))!
    await installItems(['button'], config, { silent: true })
    await writeFile(join(cwd, 'app/components/ui/button/Button.vue'), '<template><button class="fui-button mine" /></template>\n')

    const button = await readFile(join(cwd, 'app/components/ui/button/button.json'), 'utf8')
    const kept = await installItems(['button'], config, { silent: true, yes: true })
    expect(kept.files).toEqual({ filesCreated: [], filesUpdated: [], filesSkipped: ['app/components/ui/button/Button.vue', 'app/components/ui/button/index.ts'] })
    expect(kept.recipes).toEqual({
      added: [],
      replaced: [],
      kept: [
        { name: 'button', file: 'app/components/ui/button/button.json' },
        { name: 'action', file: 'library/recipes/action.json' },
      ],
    })
    expect(kept.stylesheet?.written).toBe(false)
    expect(await readFile(join(cwd, 'app/components/ui/button/button.json'), 'utf8')).toBe(button)

    const replaced = await installItems(['button'], config, { silent: true, overwrite: true })
    expect(replaced.files.filesUpdated).toEqual(['app/components/ui/button/Button.vue'])
    expect(replaced.recipes).toEqual({ added: [], replaced: [{ name: 'action', file: 'library/recipes/action.json' }], kept: [{ name: 'button', file: 'app/components/ui/button/button.json' }] })
    expect((await readRecipes(config)).flat.action).toEqual({ rounded: '{rounded.md}' })
    expect(replaced.stylesheet?.written).toBe(true)
  })

  it('writes nothing on a dry run', async () => {
    const config = (await getConfig(cwd))!
    const report = await installItems(['card'], config, { dryRun: true, silent: true })
    expect(report.items).toEqual(['button', 'card'])
    expect(report.files.filesCreated).toHaveLength(3)
    expect(report.recipes.added.map((recipe) => recipe.name)).toEqual(['button', 'card'])
    expect(existsSync(join(cwd, 'app/components'))).toBe(false)
    expect(existsSync(join(cwd, 'app/assets/frontic.css'))).toBe(false)
    expect((await readRecipes(config)).paths).toEqual({ action: 'library/recipes/action.json' })
    expect(existsSync(join(cwd, 'library/recipes/shared'))).toBe(false)
    expect(await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')).toBe(DESIGN)
  })

  it('names an unknown item before touching anything', async () => {
    const config = (await getConfig(cwd))!
    await expect(installItems(['card', 'nope'], config, { silent: true })).rejects.toThrow('Not in the Frontic registry: nope')
    expect(existsSync(join(cwd, 'app/components'))).toBe(false)
  })
})

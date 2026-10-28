import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ITEM_SCHEMA_URL, itemManifestText, recipeFileText } from '@frontic/library-contract/recipe'
import { compileStylesheet, defaultBrand, ensureImport, fixManifestOrder, fontPackages, manifestOrder, planRecipes, readBrand, readRecipes, stylesheetCurrent, writeRecipes } from '@/src/library'
import type { RegistryItem } from '@/src/registry'
import type { Config } from '@/src/schema'

let cwd: string
let config: Config

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-library-'))
  await mkdir(join(cwd, 'library'))
  await mkdir(join(cwd, 'assets/css'), { recursive: true })
  const p = (...parts: string[]) => join(cwd, ...parts)
  config = {
    style: 'bare',
    typescript: true,
    tailwind: { css: 'assets/css/tailwind.css' },
    iconLibrary: 'lucide',
    aliases: { components: '@/components' },
    library: 'library',
    resolvedPaths: {
      cwd,
      tailwindCss: p('assets/css/tailwind.css'),
      fronticCss: p('assets/css/frontic.css'),
      library: p('library'),
      brand: p('library/brand.json'),
      design: p('library/DESIGN.md'),
      recipes: p('library/recipes'),
      components: p('components'),
      ui: p('components/ui'),
      lib: p('lib'),
      composables: p('composables'),
    },
  }
})
afterEach(() => rm(cwd, { recursive: true, force: true }))

const brand = () => writeFile(config.resolvedPaths.brand, defaultBrand())
const file = (path: string) => join(config.resolvedPaths.recipes, path)
const manifestAt = (name: string, tier = 'ui') => join(cwd, 'components', tier, name, `${name}.json`)
/** Writes each recipe where `add` puts it: a tree into its component's manifest, a flat recipe into `library/recipes/<name>.json`. */
async function recipes(set: Record<string, object>) {
  for (const [name, def] of Object.entries(set)) {
    const tree = ['base', 'variants', 'defaults', 'keepAxis'].some((key) => Object.hasOwn(def, key))
    const target = tree ? manifestAt(name) : file(`${name}.json`)
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, tree ? itemManifestText({ title: name, recipes: { [name]: def } }) : recipeFileText({ [name]: def }))
  }
}
const part = { base: { padding: '{spacing.4}' } }
const button = { button: { base: { typography: '{typography.ui}' }, variants: { variant: { solid: { backgroundColor: '{colors.primary}' } } }, defaults: { variant: 'solid' } } }
const action = { action: { rounded: '{rounded.md}' } }
/** A served item as `add` reads it: its files in `components/<tier>/<name>/`, its own trees and the library recipes they need. */
const item = (name: string, own: Record<string, object>, extra: Partial<RegistryItem> = {}): RegistryItem => ({
  name,
  type: 'registry:ui',
  title: name[0]!.toUpperCase() + name.slice(1),
  description: `The ${name}.`,
  files: [{ path: `components/ui/${name}/Thing.vue`, type: 'registry:ui', content: '' }],
  recipes: own,
  ...extra,
})

describe('the brand', () => {
  it('is the default preset at init', () => {
    const tokens = JSON.parse(defaultBrand())
    expect(tokens.$extensions['com.frontic.brand'].name).toBe('Default')
  })

  it('reads brand.json and names it when missing or broken', async () => {
    await expect(readBrand(config)).rejects.toThrow(config.resolvedPaths.brand)
    await writeFile(config.resolvedPaths.brand, '{')
    await expect(readBrand(config)).rejects.toThrow(config.resolvedPaths.brand)
    await brand()
    expect((await readBrand(config)).color).toBeDefined()
  })

  it('lists the font packages the brand names', async () => {
    await brand()
    expect(await fontPackages(config)).toEqual(['@fontsource-variable/inter'])
  })
})

describe('the recipe files', () => {
  it('read as none when nothing is installed', async () => {
    expect(await readRecipes(config)).toEqual({ flat: {}, trees: {}, paths: {}, problems: [] })
  })

  it("go an item's trees, each with its composes, into its manifest beside its files, a stored item's top-level composes not, and each library recipe into library/recipes/<name>.json", async () => {
    const composed = { button: { composes: ['focus-ring'], ...button.button } }
    const plan = await planRecipes(config, [item('button', composed, { library: { recipes: action }, composes: ['focus-ring'] })])
    expect(plan).toEqual({
      writes: [
        { path: manifestAt('button'), text: itemManifestText({ title: 'Button', description: 'The button.', recipes: composed }) },
        { path: file('action.json'), text: recipeFileText(action) },
      ],
      added: [
        { name: 'button', file: 'components/ui/button/button.json' },
        { name: 'action', file: 'library/recipes/action.json' },
      ],
      replaced: [],
      kept: [],
    })
    await writeRecipes(plan.writes)
    const text = await readFile(manifestAt('button'), 'utf8')
    expect(Object.keys(JSON.parse(text))).toEqual(['$schema', 'title', 'description', 'recipes'])
    expect(Object.keys(JSON.parse(text).recipes.button)).toEqual(['composes', 'base', 'variants', 'defaults'])
    expect(JSON.parse(text).$schema).toBe(ITEM_SCHEMA_URL)
    expect(text).toBe(`${JSON.stringify(JSON.parse(text), null, 2)}\n`)
    expect((await readRecipes(config)).paths).toEqual({ button: 'components/ui/button/button.json', action: 'library/recipes/action.json' })
  })

  it('write a manifest into the folder each tier installs into, through the aliases, and none for a lib item', async () => {
    config.resolvedPaths.ui = join(cwd, 'elsewhere/ui')
    const hero = item('hero', { hero: part }, { type: 'registry:section', files: [{ path: 'components/sections/hero/Hero.vue', type: 'registry:section', content: '' }] })
    const page = item('page', { page: part }, { type: 'registry:template', files: [{ path: 'components/templates/page/Page.vue', type: 'registry:template', content: '' }] })
    const format = item('format', {}, { type: 'registry:lib', files: [{ path: 'lib/format.ts', type: 'registry:lib', content: '' }] })
    const plan = await planRecipes(config, [item('card', { card: part }), hero, page, format])
    expect(plan.writes.map((write) => write.path)).toEqual([join(cwd, 'elsewhere/ui/card/card.json'), manifestAt('hero', 'sections'), manifestAt('page', 'templates')])
    await writeRecipes(plan.writes)
    expect(Object.keys((await readRecipes(config)).paths).sort()).toEqual(['card', 'hero', 'page'])
  })

  it('keep an edited recipe, its title and description, and add the new recipe into the same manifest, leaving the order and other keys', async () => {
    const edited = { base: { gap: '{spacing.2}' } }
    await mkdir(join(manifestAt('card'), '..'), { recursive: true })
    await writeFile(manifestAt('card'), itemManifestText({ title: 'Mine', recipes: { 'card-title': part, card: edited }, composes: ['disabled'] }))
    const card = item('card', { card: part, 'card-title': part, 'card-image': part })
    const plan = await planRecipes(config, [card])
    expect(plan.writes).toEqual([
      { path: manifestAt('card'), text: itemManifestText({ title: 'Mine', description: 'The card.', recipes: { 'card-title': part, card: edited, 'card-image': part }, composes: ['disabled'] }) },
    ])
    expect(plan.added).toEqual([{ name: 'card-image', file: 'components/ui/card/card.json' }])
    expect(plan.kept).toEqual([
      { name: 'card', file: 'components/ui/card/card.json' },
      { name: 'card-title', file: 'components/ui/card/card.json' },
    ])
    const replaced = await planRecipes(config, [item('card', { card: part })], { overwrite: true })
    expect(replaced.writes).toEqual([
      { path: manifestAt('card'), text: itemManifestText({ title: 'Card', description: 'The card.', recipes: { 'card-title': part, card: part }, composes: ['disabled'] }) },
    ])
    expect(replaced.replaced).toEqual([{ name: 'card', file: 'components/ui/card/card.json' }])
  })

  it('keep a recipe where the project put it', async () => {
    await mkdir(config.resolvedPaths.recipes, { recursive: true })
    await writeFile(file('mine.json'), JSON.stringify({ action: { rounded: '{rounded.full}' } }))
    const plan = await planRecipes(config, [item('button', button, { library: { recipes: action } })], { overwrite: true })
    expect(plan.writes.map((write) => write.path)).toEqual([manifestAt('button'), file('mine.json')])
    expect(plan.replaced).toEqual([{ name: 'action', file: 'library/recipes/mine.json' }])
  })

  it('leave a manifest and a recipe file a formatter rewrote, or that lack $schema, when nothing in them changes, even with overwrite', async () => {
    const served = item('button', button, { library: { recipes: action } })
    await writeRecipes((await planRecipes(config, [served])).writes)
    const { $schema: _schema, ...manifest } = JSON.parse(await readFile(manifestAt('button'), 'utf8'))
    await writeFile(manifestAt('button'), JSON.stringify(manifest))
    await writeFile(file('action.json'), JSON.stringify(action))
    expect(await planRecipes(config, [served], { overwrite: true })).toEqual({
      writes: [],
      added: [],
      replaced: [],
      kept: [
        { name: 'button', file: 'components/ui/button/button.json' },
        { name: 'action', file: 'library/recipes/action.json' },
      ],
    })
  })

  it('refuse a recipe name defined twice, naming both files', async () => {
    await recipes({ action: action.action })
    await mkdir(join(manifestAt('button'), '..'), { recursive: true })
    await writeFile(manifestAt('button'), itemManifestText({ recipes: { ...button, action: action.action } }))
    await mkdir(join(manifestAt('badge'), '..'), { recursive: true })
    await writeFile(manifestAt('badge'), itemManifestText({ recipes: { button: part } }))
    expect((await readRecipes(config)).problems).toEqual([
      'components/ui/button/button.json: button: defined in components/ui/badge/badge.json too',
      'library/recipes/action.json: action: defined in components/ui/button/button.json too',
    ])
    await expect(planRecipes(config, [item('button', button)])).rejects.toThrow('components/ui/button/button.json: button: defined in components/ui/badge/badge.json too')
  })

  it('refuse a tree composing a name that is no shared recipe, naming the manifest', async () => {
    await brand()
    await recipes({ disabled: { opacity: '{opacity.50}' } })
    await mkdir(join(manifestAt('card'), '..'), { recursive: true })
    await writeFile(manifestAt('card'), itemManifestText({ recipes: { card: { composes: ['disabled', 'ring'], ...part } } }))
    await expect(compileStylesheet(config)).rejects.toThrow('components/ui/card/card.json: card.composes: ring is not a shared recipe')
    await writeFile(manifestAt('card'), itemManifestText({ recipes: { card: { composes: ['disabled'], ...part } } }))
    expect((await compileStylesheet(config)).written).toBe(true)
  })

  it('refuse a manifest whose name is not its folder’s, naming it', async () => {
    await mkdir(join(manifestAt('card'), '..'), { recursive: true })
    await writeFile(manifestAt('card'), itemManifestText({ name: 'badge', recipes: { card: part } }))
    expect((await readRecipes(config)).problems).toEqual(['components/ui/card/card.json: name: "badge" is not the item\'s folder name, card'])
    await writeFile(manifestAt('card'), itemManifestText({ name: 'card', recipes: { card: part } }))
    expect((await readRecipes(config)).problems).toEqual([])
  })

  it('refuse the layout before 1.0, a tree in library/recipes/ or a folder in it, naming the file and the add to run', async () => {
    await mkdir(join(cwd, 'components/ui/card'), { recursive: true })
    await mkdir(file('shared'), { recursive: true })
    await writeFile(file('shared/action.json'), recipeFileText(action))
    await writeFile(file('card.json'), recipeFileText({ card: part, 'card-title': part }))
    await writeFile(file('focus-ring.json'), recipeFileText({ 'focus-ring': { outlineColor: '{colors.ring}' } }))
    const problems = [
      "library/recipes/shared/: a folder of recipe files, the layout before 1.0; shared recipes sit directly in library/recipes/ and a component's trees in its own manifest: delete the folder and run `npx @frontic/ui add card` again",
      "library/recipes/card.json: holds the component trees card, card-title, the layout before 1.0; a component's trees live in its manifest beside its files: delete this file and run `npx @frontic/ui add card` again",
    ]
    expect((await readRecipes(config)).problems).toEqual(problems)
    await expect(planRecipes(config, [item('card', { card: part })])).rejects.toThrow(problems.join('\n'))
  })

  it('refuse to plan over a manifest or recipe file it cannot read, naming the file', async () => {
    await mkdir(config.resolvedPaths.recipes, { recursive: true })
    await writeFile(file('action.json'), '{')
    await expect(planRecipes(config, [item('button', button)])).rejects.toThrow(/^library\/recipes\/action\.json: not JSON: /)
    await rm(file('action.json'))
    await mkdir(join(manifestAt('button'), '..'), { recursive: true })
    await writeFile(manifestAt('button'), '{')
    await expect(planRecipes(config, [item('button', button)])).rejects.toThrow(/^components\/ui\/button\/button\.json: not JSON: /)
  })

  it('drop a component whose folder is gone', async () => {
    await recipes({ ...button, badge: part })
    expect(Object.keys((await readRecipes(config)).trees).sort()).toEqual(['badge', 'button'])
    await rm(join(cwd, 'components/ui/badge'), { recursive: true })
    expect(Object.keys((await readRecipes(config)).trees)).toEqual(['button'])
  })
})

describe('the manifest order', () => {
  it('names a manifest whose keys run out of order, and check --fix rewrites it in order', async () => {
    await mkdir(join(manifestAt('card'), '..'), { recursive: true })
    await writeFile(manifestAt('card'), JSON.stringify({ title: 'Card', composes: ['focus-ring'], recipes: { card: part } }))
    await recipes({ badge: part })
    expect(await manifestOrder(config)).toEqual([{ file: 'components/ui/card/card.json', message: 'keys run title, composes, recipes; a manifest orders them title, recipes, composes' }])
    expect(await fixManifestOrder(config)).toEqual(['components/ui/card/card.json'])
    expect(await readFile(manifestAt('card'), 'utf8')).toBe(itemManifestText({ title: 'Card', recipes: { card: part }, composes: ['focus-ring'] }))
    expect(await manifestOrder(config)).toEqual([])
  })
})

describe('the stylesheet', () => {
  it('names the recipe file of each untyped property it renders as written', async () => {
    await brand()
    await recipes({ card: { cursor: 'pointer' } })
    expect((await compileStylesheet(config)).warnings).toEqual(['library/recipes/card.json: card.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value'])
  })

  it('compiles the brand and the recipes, and writes only on change', async () => {
    await brand()
    await recipes(button)
    const first = await compileStylesheet(config)
    expect(first).toEqual({ written: true, path: config.resolvedPaths.fronticCss, warnings: [] })
    const css = await readFile(first.path, 'utf8')
    expect(css).toContain('@utility fui-button')
    expect(css).toContain('--color-primary')
    expect(await compileStylesheet(config)).toEqual({ written: false, path: first.path, warnings: [] })
    expect(await stylesheetCurrent(config)).toBe(true)
    await recipes({ badge: { base: {} } })
    expect(await stylesheetCurrent(config)).toBe(false)
  })

  it('is missing until compiled', async () => {
    await brand()
    expect(await stylesheetCurrent(config)).toBe(false)
  })

  it('leaves the previous frontic.css when the contract refuses the input', async () => {
    await brand()
    await recipes(button)
    const { path } = await compileStylesheet(config)
    const before = await readFile(path, 'utf8')
    await recipes({ broken: { extends: ['action'] } })
    await expect(compileStylesheet(config)).rejects.toThrow(/^library\/recipes\/broken\.json: recipe broken/m)
    expect(await readFile(path, 'utf8')).toBe(before)
  })
  it('refuses an opacity token outside 0 to 100, which would render every element using it invisible', async () => {
    const tokens = JSON.parse(defaultBrand())
    await writeFile(config.resolvedPaths.brand, JSON.stringify({ ...tokens, opacity: { faint: { $value: '50' } } }))
    await expect(compileStylesheet(config)).rejects.toThrow('opacity.faint: an opacity is an integer from 0 to 100')
  })

  it('refuses a colour name two groups write, naming both paths', async () => {
    const tokens = JSON.parse(defaultBrand())
    tokens.color.tone = { primary: { $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } } }
    await writeFile(config.resolvedPaths.brand, JSON.stringify(tokens))
    await expect(compileStylesheet(config)).rejects.toThrow(
      'library/brand.json:\ncolor.action.primary, color.tone.primary: both declare --fui-primary; a colour name is unique across the colour groups',
    )
  })

  it('refuses a recipe that names a token the brand does not define, each at its file and path, and leaves the previous frontic.css', async () => {
    await brand()
    await recipes(button)
    const { path } = await compileStylesheet(config)
    const before = await readFile(path, 'utf8')
    await recipes({ button: { ...button.button, base: { typography: '{typography.ui}', rounded: '{rounded.huge}' } }, note: { textColor: '{colors.nope}' } })
    const refused = compileStylesheet(config)
    await expect(refused).rejects.toThrow('components/ui/button/button.json: button.base.rounded: {rounded.huge} is not in library/brand.json')
    await expect(compileStylesheet(config)).rejects.toThrow(/^library\/recipes\/note\.json: note\.textColor: \{colors\.nope\} is not in library\/brand\.json$/m)
    await expect(stylesheetCurrent(config)).rejects.toThrow('{colors.nope} is not in library/brand.json')
    expect(await readFile(path, 'utf8')).toBe(before)
  })

  it('says a hover the contract derives none for is the brand’s to write, naming the colours it derives one for', async () => {
    await brand()
    await recipes({ quiet: { hover: { backgroundColor: '{colors.secondary-hover}' } } })
    await expect(compileStylesheet(config)).rejects.toThrow(
      'library/recipes/quiet.json: quiet.hover.backgroundColor: {colors.secondary-hover} is not in library/brand.json: the contract derives a hover only for the colours a component hovers (primary, buy, checkout, destructive, foreground); write secondary-hover in library/brand.json to give secondary one',
    )
  })

  it('says to write the hover of a colour the contract hovers but derived none for, without the list it is on', async () => {
    const tokens = JSON.parse(defaultBrand())
    tokens.color.action.primary.$value = { ...tokens.color.action.primary.$value, alpha: 0.5 }
    await writeFile(config.resolvedPaths.brand, JSON.stringify(tokens))
    await recipes({ press: { hover: { backgroundColor: '{colors.primary-hover}' } } })
    await expect(compileStylesheet(config)).rejects.toThrow(
      /^library\/recipes\/press\.json: press\.hover\.backgroundColor: \{colors\.primary-hover\} is not in library\/brand\.json: the contract derives none for primary here; write primary-hover in library\/brand\.json$/m,
    )
  })

  it('says why a hover the brand leaves out is no token, when a derived one would fail its foreground', async () => {
    const tokens = JSON.parse(defaultBrand())
    delete tokens.color.action['primary-hover']
    tokens.color.action.primary.$value = { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' }
    tokens.color.action['primary-foreground'].$value = { colorSpace: 'srgb', components: [0.4588, 0.4588, 0.4588], hex: '#757575' }
    await writeFile(config.resolvedPaths.brand, JSON.stringify(tokens))
    await recipes({ press: { hover: { backgroundColor: '{colors.primary-hover}' } } })
    await expect(compileStylesheet(config)).rejects.toThrow(
      'library/recipes/press.json: press.hover.backgroundColor: {colors.primary-hover} is not derived: a derived hover would fall to 2.95:1 against primary-foreground; set it in library/brand.json',
    )
  })

  it('refuses a brand reference that does not resolve, at its token path, and leaves the previous frontic.css', async () => {
    await brand()
    const { path } = await compileStylesheet(config)
    const before = await readFile(path, 'utf8')
    const tokens = JSON.parse(defaultBrand())
    tokens.color.edge.border = { $value: '{color.edge.nope}' }
    tokens.color.edge.input = { $value: '{color.edge.input}' }
    await writeFile(config.resolvedPaths.brand, JSON.stringify(tokens))
    await expect(compileStylesheet(config)).rejects.toThrow(
      /^library\/brand\.json:\ncolor\.edge\.border: \{color\.edge\.nope\}, which is no token\ncolor\.edge\.input: \{color\.edge\.input\}, which leads back to it$/m,
    )
    expect(await readFile(path, 'utf8')).toBe(before)
  })

  it('renders a brand that writes references with a var() for each one a var can carry', async () => {
    const tokens = JSON.parse(defaultBrand())
    tokens.color.surface.popover = { $value: '{color.surface.background}' }
    tokens.font.weight.bold = { $value: '{font.weight.semibold}' }
    await writeFile(config.resolvedPaths.brand, JSON.stringify(tokens))
    const { path } = await compileStylesheet(config)
    const css = await readFile(path, 'utf8')
    expect(css).toContain('--fui-popover: var(--fui-background);')
    expect(css).toContain('--fui-font-weight-bold: var(--fui-font-weight-semibold);')
  })

  it('refuses a container named like a Tailwind width keyword, which it would override', async () => {
    const tokens = JSON.parse(defaultBrand())
    await writeFile(config.resolvedPaths.brand, JSON.stringify({ ...tokens, container: { $type: 'dimension', full: { $value: { value: 640, unit: 'px' } } } }))
    await expect(compileStylesheet(config)).rejects.toThrow(/^library\/brand\.json:\ncontainer\.full: it would override Tailwind's own max-w-full/)
  })

  it('refuses a recipe value the contract refuses, naming its path, and leaves the previous frontic.css', async () => {
    await brand()
    await recipes(button)
    const { path } = await compileStylesheet(config)
    const before = await readFile(path, 'utf8')
    await recipes({ disabled: { opacity: '0.5' } })
    await expect(compileStylesheet(config)).rejects.toThrow('library/recipes/disabled.json: disabled.opacity: 0.5 — opacity takes {opacity.<name>}')
    expect(await readFile(path, 'utf8')).toBe(before)
  })

  it('leaves the previous frontic.css when a recipe file is not JSON, naming it', async () => {
    await brand()
    await recipes(button)
    const { path } = await compileStylesheet(config)
    const before = await readFile(path, 'utf8')
    await mkdir(config.resolvedPaths.recipes, { recursive: true })
    await writeFile(file('card.json'), '{ "base": ', 'utf8')
    await expect(compileStylesheet(config)).rejects.toThrow(/^library\/recipes\/card\.json: not JSON: /)
    expect(await readFile(path, 'utf8')).toBe(before)
  })
})

describe('the import line', () => {
  it('goes right after the tailwindcss import, once', async () => {
    await writeFile(config.resolvedPaths.tailwindCss, '@import "tailwindcss";\n@import "tw-animate-css";\n')
    expect(await ensureImport(config)).toBe(true)
    expect(await readFile(config.resolvedPaths.tailwindCss, 'utf8')).toBe('@import "tailwindcss";\n@import "./frontic.css";\n@import "tw-animate-css";\n')
    expect(await ensureImport(config)).toBe(false)
    expect(await readFile(config.resolvedPaths.tailwindCss, 'utf8')).toBe('@import "tailwindcss";\n@import "./frontic.css";\n@import "tw-animate-css";\n')
  })

  it('goes at the top without a tailwindcss import, and errors without the file', async () => {
    await writeFile(config.resolvedPaths.tailwindCss, 'body { margin: 0 }\n')
    await ensureImport(config)
    expect(await readFile(config.resolvedPaths.tailwindCss, 'utf8')).toBe('@import "./frontic.css";\nbody { margin: 0 }\n')
    await rm(config.resolvedPaths.tailwindCss)
    expect(existsSync(config.resolvedPaths.tailwindCss)).toBe(false)
    await expect(ensureImport(config)).rejects.toThrow(config.resolvedPaths.tailwindCss)
  })
})

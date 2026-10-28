import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addDependency } from 'nypm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runBuild } from '@/src/commands/build'
import { itemManifestText, recipeFileText } from '@frontic/library-contract/recipe'
import { defaultBrand } from '@/src/library'
import { logger } from '@/src/utils/logger'

vi.mock('nypm', () => ({ addDependency: vi.fn(async () => {}), detectPackageManager: vi.fn(async () => null) }))

let cwd: string

/** Writes a shared recipe file, library/recipes/<name>.json, holding `def` under its name. */
async function recipe(name: string, def: object) {
  await mkdir(join(cwd, 'library/recipes', name, '..'), { recursive: true })
  await writeFile(join(cwd, 'library/recipes', `${name}.json`), recipeFileText({ [name.split('/').pop()!]: def }))
}

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-build-'))
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'shop', dependencies: { '@fontsource-variable/inter': '^5.0.0' } }))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } } }))
  await writeFile(join(cwd, 'components.json'), JSON.stringify({ style: 'bare', tailwind: { css: 'assets/css/tailwind.css' }, aliases: { components: '@/components' } }))
  await mkdir(join(cwd, 'library'))
  await mkdir(join(cwd, 'assets/css'), { recursive: true })
  await writeFile(join(cwd, 'library/brand.json'), defaultBrand())
})

afterEach(async () => {
  vi.mocked(addDependency).mockClear()
  await rm(cwd, { recursive: true, force: true })
})

describe('build', () => {
  it('compiles frontic.css, then says it is current', async () => {
    const first = await runBuild({ cwd, silent: true })
    expect(first.stylesheet).toEqual({ written: true, path: join(cwd, 'assets/css/frontic.css'), warnings: [] })
    expect(await readFile(first.stylesheet.path, 'utf8')).toContain('@theme inline')
    expect((await runBuild({ cwd, silent: true })).stylesheet.written).toBe(false)
  })

  it('refuses a 0.9 one-recipe file, naming it and the shape it needs, and writes no frontic.css', async () => {
    await mkdir(join(cwd, 'library/recipes'), { recursive: true })
    await writeFile(join(cwd, 'library/recipes/button.json'), JSON.stringify({ base: { typography: '{typography.ui}' } }))
    await expect(runBuild({ cwd, silent: true })).rejects.toThrow('library/recipes/button.json: holds one recipe, the 0.9 shape; a recipe file holds recipes by name: { "button": { … } }')
    expect(existsSync(join(cwd, 'assets/css/frontic.css'))).toBe(false)
  })

  it('installs only the font packages package.json lacks', async () => {
    expect((await runBuild({ cwd, silent: true })).fonts).toEqual([])
    expect(addDependency).not.toHaveBeenCalled()

    const brand = JSON.parse(defaultBrand())
    brand.font.family.heading = { $value: ['Archivo Variable', 'sans-serif'], $extensions: { 'com.frontic.brand': { fontsource: '@fontsource-variable/archivo' } } }
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    expect((await runBuild({ cwd, silent: true })).fonts).toEqual(['@fontsource-variable/archivo'])
    expect(addDependency).toHaveBeenCalledWith(['@fontsource-variable/archivo'], { cwd, silent: true, dev: false })
  })

  it('imports each brand font package.json has, under the header, and installs a missing one before it writes the import', async () => {
    const lines = async () => (await readFile(join(cwd, 'assets/css/frontic.css'), 'utf8')).split('\n')
    await runBuild({ cwd, silent: true })
    expect((await lines())[1]).toBe("@import '@fontsource-variable/inter';")

    const brand = JSON.parse(defaultBrand())
    brand.font.family.heading = { $value: ['Archivo Variable', 'sans-serif'], $extensions: { 'com.frontic.brand': { fontsource: '@fontsource-variable/archivo' } } }
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    // An install that fails leaves package.json without the package: no import that would not resolve.
    await runBuild({ cwd, silent: true })
    expect((await lines()).filter((line) => line.startsWith('@import'))).toEqual(["@import '@fontsource-variable/inter';"])
    // An install that lands comes first, so the stylesheet written after it imports the font.
    vi.mocked(addDependency).mockImplementationOnce(async () => {
      const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
      await writeFile(join(cwd, 'package.json'), JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@fontsource-variable/archivo': '^5.0.0' } }))
      return undefined as never
    })
    await runBuild({ cwd, silent: true })
    expect((await lines()).slice(1, 3)).toEqual(["@import '@fontsource-variable/archivo';", "@import '@fontsource-variable/inter';"])
  })

  it('still writes frontic.css when the font install fails, leaving the font out', async () => {
    const brand = JSON.parse(defaultBrand())
    brand.font.family.heading = { $value: ['Archivo Variable', 'sans-serif'], $extensions: { 'com.frontic.brand': { fontsource: '@fontsource-variable/archivo' } } }
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    vi.mocked(addDependency).mockRejectedValueOnce(new Error('network unreachable'))

    const result = await runBuild({ cwd, silent: true })

    expect(result.stylesheet.written).toBe(true)
    expect(result.fonts).toEqual([])
    const css = await readFile(join(cwd, 'assets/css/frontic.css'), 'utf8')
    expect(css.split('\n').filter((line) => line.startsWith('@import'))).toEqual(["@import '@fontsource-variable/inter';"])
    expect(css).toContain('Archivo Variable')
  })

  it('warns about a token pair below WCAG contrast and still writes frontic.css', async () => {
    const brand = JSON.parse(defaultBrand())
    const white = { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' }
    brand.color.action.primary = { $value: white }
    brand.color.action['primary-foreground'] = { $value: { ...white, hex: '#f0f0f0', components: [240 / 255, 240 / 255, 240 / 255] } }
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const result = await runBuild({ cwd, silent: false })
      expect(result.stylesheet.written).toBe(true)
      expect(result.findings).toContainEqual({ rule: 'contrast', severity: 'error', where: 'action.primary / action.primary-foreground', message: '1.14:1, needs 4.5:1', file: 'library/brand.json' })
      expect(warn).toHaveBeenCalledWith('contrast: action.primary / action.primary-foreground: 1.14:1, needs 4.5:1')
      expect(warn).toHaveBeenCalledTimes(result.findings.length)
      warn.mockClear()
      await runBuild({ cwd, silent: true })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('warns about a recipe colour below its contrast threshold and still writes frontic.css', async () => {
    await recipe('chip', { textColor: '{colors.muted}' })
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const result = await runBuild({ cwd, silent: false })
      expect(result.stylesheet.written).toBe(true)
      expect(result.findings).toEqual([
        expect.objectContaining({
          rule: 'contrast',
          where: 'chip',
          file: 'library/recipes/chip.json',
          recipe: 'chip',
          message: expect.stringMatching(/^text \{colors\.muted\} on page\.background,card,popover is [\d.]+:1, needs 4\.5:1$/),
        }),
      ])
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^contrast: chip: text \{colors\.muted\} on page\.background,card,popover is [\d.]+:1, needs 4\.5:1$/))
    } finally {
      warn.mockRestore()
    }
  })

  it('build warns on drift and still writes frontic.css', async () => {
    await mkdir(join(cwd, 'app/pages'), { recursive: true })
    await writeFile(join(cwd, 'app/pages/index.vue'), '<template>\n  <div class="bg-blue-500" />\n</template>\n')
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const result = await runBuild({ cwd, silent: false })
      expect(result.stylesheet.written).toBe(true)
      expect(result.findings).toEqual([expect.objectContaining({ rule: 'drift', severity: 'error', where: expect.stringMatching(/^app\/pages\/index\.vue:2:/) })])
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^drift: app\/pages\/index\.vue:2:\d+: /))
    } finally {
      warn.mockRestore()
    }
  }, 60_000)

  it('warns when the checks cannot run and still exits as before', async () => {
    await mkdir(join(cwd, 'app'), { recursive: true })
    await writeFile(join(cwd, 'app/app.vue'), '<template><div /></template>\n')
    await mkdir(join(cwd, 'node_modules'), { recursive: true })
    await writeFile(join(cwd, 'node_modules/.cache'), 'a file where the check cache goes')
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const result = await runBuild({ cwd, silent: false })
      expect(result.stylesheet.written).toBe(true)
      expect(result.findings).toEqual([])
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^check could not run: .*(EEXIST|ENOTDIR)/))
    } finally {
      warn.mockRestore()
    }
  }, 60_000)

  it('renders an untyped recipe property and warns about it by path', async () => {
    await recipe('card', { cursor: 'pointer' })
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      const result = await runBuild({ cwd, silent: false })
      expect(result.stylesheet.written).toBe(true)
      expect(await readFile(result.stylesheet.path, 'utf8')).toContain('cursor: var(--fui-card-cursor)')
      expect(result.stylesheet.warnings).toEqual(['library/recipes/card.json: card.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value'])
      expect(warn).toHaveBeenCalledWith('library/recipes/card.json: card.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value')
    } finally {
      warn.mockRestore()
    }
  })

  it('refuses a broken recipe with its message and leaves frontic.css', async () => {
    const { stylesheet } = await runBuild({ cwd, silent: true })
    const before = await readFile(stylesheet.path, 'utf8')
    await recipe('broken', { extends: ['action'] })
    await expect(runBuild({ cwd, silent: true })).rejects.toThrow(/^library\/recipes\/broken\.json: recipe broken/m)
    expect(await readFile(stylesheet.path, 'utf8')).toBe(before)
  })

  it('compiles each installed component manifest’s recipes, and drops a component’s classes once its folder is gone', async () => {
    const manifest = (name: string, tier = 'ui') =>
      mkdir(join(cwd, 'components', tier, name), { recursive: true }).then(() =>
        writeFile(join(cwd, 'components', tier, name, `${name}.json`), itemManifestText({ title: name, recipes: { [name]: { base: { padding: '{spacing.4}' } } } })),
      )
    await manifest('hero', 'sections')
    const { stylesheet } = await runBuild({ cwd, silent: true })
    const heroOnly = await readFile(stylesheet.path, 'utf8')
    expect(heroOnly).toContain('@utility fui-hero {')
    await manifest('card')
    await runBuild({ cwd, silent: true })
    expect(await readFile(stylesheet.path, 'utf8')).toContain('@utility fui-card {')
    await rm(join(cwd, 'components/ui/card'), { recursive: true })
    expect((await runBuild({ cwd, silent: true })).stylesheet.written).toBe(true)
    expect(await readFile(stylesheet.path, 'utf8')).toBe(heroOnly)
  })

  it('refuses the layout before 1.0, naming each file and the add to run, and writes no frontic.css', async () => {
    await mkdir(join(cwd, 'components/ui/button'), { recursive: true })
    await recipe('shared/action', { rounded: '{rounded.md}' })
    await recipe('button', { base: { extends: 'action' } })
    await expect(runBuild({ cwd, silent: true })).rejects.toThrow(
      [
        "library/recipes/shared/: a folder of recipe files, the layout before 1.0; shared recipes sit directly in library/recipes/ and a component's trees in its own manifest: delete the folder and run `npx @frontic/ui add button` again",
        "library/recipes/button.json: holds the component tree button, the layout before 1.0; a component's trees live in its manifest beside its files: delete this file and run `npx @frontic/ui add button` again",
      ].join('\n'),
    )
    expect(existsSync(join(cwd, 'assets/css/frontic.css'))).toBe(false)
  })

  it('needs a components.json', async () => {
    await rm(join(cwd, 'components.json'))
    await expect(runBuild({ cwd, silent: true })).rejects.toThrow(/components\.json/)
  })
})

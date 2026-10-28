import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runInit, type InitOptions } from '@/src/commands/init'
import { recipeFileText } from '@frontic/library-contract/recipe'
import { defaultBrand } from '@/src/library'
import { logger } from '@/src/utils/logger'

const PACKAGE_AGENTS = join(__dirname, '../../content/AGENTS.md')

const PACKAGE_JSON = { name: 'shop', devDependencies: { tailwindcss: '^4.3.0', typescript: '^5.7.2', vite: '^7.0.0' } }

let cwd: string

const options = (overrides: Partial<InitOptions & { skipPreflight: boolean }> = {}): InitOptions & { skipPreflight?: boolean } => ({
  cwd,
  yes: true,
  defaults: true,
  force: false,
  silent: true,
  ...overrides,
})

/** A Vite project with Tailwind v4 imported from src/assets/css/tailwind.css and `@/*` pointing at src/. */
async function viteProject(dir: string) {
  await writeFile(join(dir, 'package.json'), `${JSON.stringify(PACKAGE_JSON, null, 2)}\n`)
  await writeFile(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } }))
  await writeFile(join(dir, 'vite.config.ts'), 'export default {}\n')
  await mkdir(join(dir, 'src/assets/css'), { recursive: true })
  await writeFile(join(dir, 'src/assets/css/tailwind.css'), '@import "tailwindcss";\n')
}

beforeEach(async () => {
  vi.stubEnv('FRONTIC_SKIP_INSTALL', '1')
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-init-'))
  await viteProject(cwd)
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await rm(cwd, { recursive: true, force: true })
})

describe('runInit', () => {
  it('writes components.json, the default library, frontic.css and the import with defaults', async () => {
    const report = await runInit(options())

    expect(JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8'))).toEqual({
      $schema: 'https://registry.ui.frontic.com/schema.json',
      style: 'bare',
      typescript: true,
      tailwind: { css: 'src/assets/css/tailwind.css' },
      iconLibrary: 'lucide',
      aliases: { components: '@/components', ui: '@/components/ui', lib: '@/lib', composables: '@/composables' },
      library: 'library',
      check: { contrast: 'AA', rules: { drift: 'error', 'raw-text': 'warn', contrast: 'error', 'missing-token': 'error', 'axis-collision': 'warn' } },
    })
    expect(await readFile(join(cwd, 'library/brand.json'), 'utf8')).toBe(defaultBrand())
    const design = await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')
    expect(design).toBe("## Overview\n\n## Colors\n\n## Typography\n\n## Layout\n\n## Elevation & Depth\n\n## Shapes\n\n## Components\n\n## Do's and Don'ts\n")
    expect(await readdir(join(cwd, 'library/recipes'))).toEqual([])
    expect(await readFile(join(cwd, 'src/assets/css/frontic.css'), 'utf8')).toContain('theme')
    expect(await readFile(join(cwd, 'src/assets/css/tailwind.css'), 'utf8')).toBe('@import "tailwindcss";\n@import "./frontic.css";\n')
    expect(await readFile(join(cwd, 'src/components/AGENTS.md'), 'utf8')).toBe(await readFile(PACKAGE_AGENTS, 'utf8'))

    expect(report.config.resolvedPaths.library).toBe(join(cwd, 'library'))
    expect(report.written).toEqual([
      'components.json',
      'library/brand.json',
      'library/DESIGN.md',
      'src/components/AGENTS.md',
      'library/recipes/',
      'src/assets/css/frontic.css',
      'src/assets/css/tailwind.css',
    ])
    expect(report.kept).toEqual([])
  })

  it('warns about an untyped property a kept recipe file sets, naming the file', async () => {
    await runInit(options())
    await mkdir(join(cwd, 'library/recipes'), { recursive: true })
    await writeFile(join(cwd, 'library/recipes/action.json'), recipeFileText({ action: { cursor: 'pointer' } }))
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      await runInit(options({ force: true, silent: false }))
      expect(warn).toHaveBeenCalledWith('library/recipes/action.json: action.cursor: cursor is not a typed recipe property; it renders as written, with no check on its value')
    } finally {
      warn.mockRestore()
    }
  })

  it('points AGENTS.md at the library --library names', async () => {
    await runInit(options({ library: 'design' }))

    const agents = await readFile(join(cwd, 'src/components/AGENTS.md'), 'utf8')
    expect(agents).toContain('`design/brand.json`')
    expect(agents).toContain('`design/recipes/`')
    expect(agents).not.toContain('`library/')
  })

  it('writes a second AGENTS.md into a ui folder outside the components folder, with its barrel import', async () => {
    await runInit(options())
    const config = JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8'))
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...config, aliases: { ...config.aliases, ui: '@/ui' } }))

    const report = await runInit(options({ force: true, skipPreflight: true }))

    const agents = await readFile(join(cwd, 'src/ui/AGENTS.md'), 'utf8')
    expect(agents).toContain("import { Button } from '@/ui/button'")
    expect(agents).not.toContain('@/components/ui/')
    expect(report.written).toContain('src/ui/AGENTS.md')
    expect(report.kept).toContain('src/components/AGENTS.md')
  })

  it('keeps an existing brand.json, DESIGN.md, AGENTS.md and recipes folder byte for byte and says so', async () => {
    await runInit(options())
    const brand = '{\n  "colors": { "primary": "#123456" }\n}\n'
    const design = '---\nname: Mine\n---\nMine.\n'
    await writeFile(join(cwd, 'library/brand.json'), brand)
    await writeFile(join(cwd, 'library/DESIGN.md'), design)
    await writeFile(join(cwd, 'src/components/AGENTS.md'), design)

    const report = await runInit(options({ force: true }))

    expect(await readFile(join(cwd, 'library/brand.json'), 'utf8')).toBe(brand)
    expect(await readFile(join(cwd, 'library/DESIGN.md'), 'utf8')).toBe(design)
    expect(await readFile(join(cwd, 'src/components/AGENTS.md'), 'utf8')).toBe(design)
    expect(report.kept).toEqual(['library/brand.json', 'library/DESIGN.md', 'src/components/AGENTS.md', 'library/recipes/'])
    expect(report.written).toEqual(['components.json', 'src/assets/css/frontic.css'])
  })

  it('moves the library with --library', async () => {
    await runInit(options({ library: 'design' }))

    expect(JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8')).library).toBe('design')
    expect(await readFile(join(cwd, 'design/brand.json'), 'utf8')).toBe(defaultBrand())
    expect(existsSync(join(cwd, 'design/DESIGN.md'))).toBe(true)
    expect(existsSync(join(cwd, 'library'))).toBe(false)
  })

  it('compiles frontic.css beside the global CSS wherever that is', async () => {
    await rm(join(cwd, 'src/assets'), { recursive: true })
    await writeFile(join(cwd, 'src/style.css'), '@import "tailwindcss";\n@import "./fonts.css";\n')

    await runInit(options())

    expect(JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8')).tailwind).toEqual({ css: 'src/style.css' })
    expect(await readFile(join(cwd, 'src/frontic.css'), 'utf8')).toContain('theme')
    expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe('@import "tailwindcss";\n@import "./frontic.css";\n@import "./fonts.css";\n')
  })

  it('takes the icon library from --icon-library', async () => {
    await runInit(options({ iconLibrary: 'phosphor' }))
    expect(JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8')).iconLibrary).toBe('phosphor')
  })

  it('reports the base packages instead of installing them under FRONTIC_SKIP_INSTALL', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})

    await runInit(options({ silent: false, iconLibrary: 'hugeicons' }))

    const lines = info.mock.calls.map((call) => call.join(' '))
    expect(lines).toContain('Would install: reka-ui, class-variance-authority, @hugeicons/vue, @hugeicons/core-free-icons')
    expect(lines).toContain('Would install (dev): tw-animate-css')
    expect(JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))).toEqual(PACKAGE_JSON)
  })

  it('adds typescript 6 as a dev dependency only when the project has no typescript', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'shop', devDependencies: { tailwindcss: '^4.3.0', vite: '^7.0.0' } }))

    await runInit(options({ silent: false }))

    expect(info.mock.calls.map((call) => call.join(' '))).toContain('Would install (dev): tw-animate-css, typescript@^6')
  })

  it('rewrites a components.json it cannot parse with --force, such as a shadcn-vue one', async () => {
    await writeFile(
      join(cwd, 'components.json'),
      JSON.stringify({ style: 'new-york', tailwind: { css: 'src/assets/css/tailwind.css', baseColor: 'zinc' }, aliases: { components: '@/components', utils: '@/lib/utils' } }),
    )

    await runInit(options({ force: true, skipPreflight: true }))

    expect(JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8')).style).toBe('bare')
  })

  describe('with --force on an existing components.json', () => {
    const file = () => join(cwd, 'components.json')
    let existing: Record<string, unknown>

    beforeEach(async () => {
      await runInit(options({ iconLibrary: 'tabler', library: 'design' }))
      await writeFile(join(cwd, 'src/main.css'), 'body {}\n')
      existing = {
        ...JSON.parse(await readFile(file(), 'utf8')),
        tailwind: { css: 'src/main.css' },
        aliases: { components: '@/app/components', ui: '@/app/components/ui', lib: '@/app/lib', composables: '@/app/composables' },
      }
      await writeFile(file(), JSON.stringify(existing))
    })

    it('keeps the icon library, the CSS path, the aliases and the library', async () => {
      await runInit(options({ force: true, skipPreflight: true }))
      expect(JSON.parse(await readFile(file(), 'utf8'))).toEqual(existing)
    })

    it('still takes the icon library and the library from the options', async () => {
      await runInit(options({ force: true, skipPreflight: true, iconLibrary: 'phosphor', library: 'brand' }))
      expect(JSON.parse(await readFile(file(), 'utf8'))).toEqual({ ...existing, iconLibrary: 'phosphor', library: 'brand' })
    })
  })

  it('refuses to overwrite components.json without --force', async () => {
    await runInit(options())
    await expect(runInit(options({ skipPreflight: true }))).rejects.toThrow(/components.json file already exists/)
  })

  it('rejects an unknown icon library', async () => {
    await expect(runInit(options({ iconLibrary: 'feather' }))).rejects.toThrow(/Unknown icon library feather/)
  })
})

describe('the init summary', () => {
  it('shows the root ConfigProvider the items read from', async () => {
    const { initDoneMessage } = await import('@/src/commands/init')
    expect(initDoneMessage()).toContain('<ConfigProvider dir="ltr" locale="en-US">')
  })
})

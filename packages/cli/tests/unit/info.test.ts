import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { projectReport } from '@/src/commands/info'
import { itemManifestText, recipeFileText } from '@frontic/library-contract/recipe'
import { defaultBrand } from '@/src/library'

let cwd: string

const config = {
  style: 'bare',
  typescript: true,
  tailwind: { css: 'src/assets/css/tailwind.css' },
  iconLibrary: 'lucide',
  aliases: { components: '@/components', ui: '@/components/ui', lib: '@/lib', composables: '@/composables' },
  library: 'library',
}

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-info-'))
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'shop', devDependencies: { tailwindcss: '^4.3.0', vite: '^7.0.0' } }))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }))
  await writeFile(join(cwd, 'vite.config.ts'), 'export default {}\n')
  await writeFile(join(cwd, 'components.json'), JSON.stringify(config))
  await mkdir(join(cwd, 'src/assets/css'), { recursive: true })
  await writeFile(join(cwd, 'src/assets/css/tailwind.css'), '@import "tailwindcss";\n')
  await mkdir(join(cwd, 'library'))
  await writeFile(join(cwd, 'library/DESIGN.md'), 'Notes about this brand.\n')
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

describe('projectReport', () => {
  it('counts the recipe files and the recipes they hold, none before any add', async () => {
    await writeFile(join(cwd, 'library/brand.json'), defaultBrand())
    expect(await projectReport(cwd)).toMatchObject({ recipes: 0, recipeFiles: 0 })
    await mkdir(join(cwd, 'library/recipes'), { recursive: true })
    await mkdir(join(cwd, 'src/components/ui/card'), { recursive: true })
    await writeFile(join(cwd, 'src/components/ui/card/card.json'), itemManifestText({ recipes: { card: { base: {} }, 'card-header': { base: {} } } }))
    await writeFile(join(cwd, 'library/recipes/action.json'), recipeFileText({ action: { rounded: '{rounded.md}' } }))
    expect(await projectReport(cwd)).toMatchObject({ recipes: 3, recipeFiles: 2 })
  })

  it('reports a readable brand with its contrast problems and the stylesheet status', async () => {
    await writeFile(join(cwd, 'library/brand.json'), defaultBrand())

    const report = await projectReport(cwd)

    expect(report.brand).toBe(true)
    expect(report.brandError).toBeNull()
    expect(report.stylesheet).toBe('missing')
    expect(Array.isArray(report.contrast)).toBe(true)
  })

  it('reports recipe colours below their contrast threshold beside the token pairs', async () => {
    await writeFile(join(cwd, 'library/brand.json'), defaultBrand())
    await mkdir(join(cwd, 'library/recipes'), { recursive: true })
    await writeFile(join(cwd, 'library/recipes/chip.json'), recipeFileText({ chip: { textColor: '{colors.muted}' } }))

    const report = await projectReport(cwd)

    expect(report.recipeContrast).toEqual([expect.objectContaining({ recipe: 'chip', role: 'text', over: '{colors.muted}' })])
  })

  it('measures contrast at the level components.json sets', async () => {
    await writeFile(join(cwd, 'library/brand.json'), defaultBrand())
    expect((await projectReport(cwd)).contrast).toEqual([])
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...config, check: { contrast: 'AAA' } }))
    const report = await projectReport(cwd)
    expect(report.contrast?.length).toBeGreaterThan(0)
    expect(report.contrast?.every((p) => p.needs === 7)).toBe(true)
  })

  it('reports a brand.json that parses but fails the contract at render', async () => {
    const brand = JSON.parse(defaultBrand())
    brand.text.body.$extensions['com.frontic.brand'].steps = { md: 'bad' }
    await writeFile(join(cwd, 'library/brand.json'), JSON.stringify(brand))
    await writeFile(join(cwd, 'src/assets/css/frontic.css'), '/* stale */\n')

    const report = await projectReport(cwd)

    expect(report.brandError).toBeNull()
    expect(report.stylesheetError).toMatch(/steps|md/)
    expect(report.stylesheet).toBe('unchecked')
    expect(Array.isArray(report.contrast)).toBe(true)
  })

  it('reports a brand.json it cannot read instead of failing', async () => {
    await writeFile(join(cwd, 'library/brand.json'), '{ not json')
    await writeFile(join(cwd, 'src/assets/css/frontic.css'), '/* stale */\n')

    const report = await projectReport(cwd)

    expect(report.brand).toBe(true)
    expect(report.brandError).toMatch(/not JSON/)
    expect(report.stylesheetError).toBeNull()
    expect(report.stylesheet).toBe('unchecked')
    expect(report.contrast).toBeNull()
    expect(report.recipeContrast).toBeNull()
  })
})

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { rawConfigSchema } from '@/src/schema'
import { getConfig, getRawConfig } from '@/src/utils/get-config'

const minimal = { style: 'bare', tailwind: { css: 'assets/css/tailwind.css' }, aliases: { components: '@/components' } }

describe('components.json', () => {
  it("has no utils alias: an older file's is dropped", () => {
    const config = rawConfigSchema.parse({ ...minimal, aliases: { components: '@/components', utils: '@/lib/utils' } })
    expect(config.aliases).toEqual({ components: '@/components' })
  })

  it('fills the defaults', () => {
    const config = rawConfigSchema.parse(minimal)
    expect(config.typescript).toBe(true)
    expect(config.iconLibrary).toBe('lucide')
    expect(config.library).toBe('library')
  })

  it('strips what an older file carried', () => {
    const config = rawConfigSchema.parse({
      ...minimal,
      base: 'reka',
      font: 'inter',
      tailwind: { css: 'x.css', config: '', baseColor: 'neutral', cssVariables: true, darkMode: false, prefix: '' },
      aliases: { ...minimal.aliases, hooks: '@/hooks' },
      registries: {},
    })
    expect(config).not.toHaveProperty('base')
    expect(config).not.toHaveProperty('registries')
    expect(config.tailwind).toEqual({ css: 'x.css' })
    expect(config.aliases).not.toHaveProperty('hooks')
  })

  it('rejects any style but bare, naming it', () => {
    const result = rawConfigSchema.safeParse({ ...minimal, style: 'oregon' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('bare')
  })

  it('rejects an unknown icon library', () => {
    expect(rawConfigSchema.safeParse({ ...minimal, iconLibrary: 'radix' }).success).toBe(false)
  })
})

describe('the check block', () => {
  it('parses an empty check block to its defaults', () => {
    const defaults = { contrast: 'AA', rules: { drift: 'error', 'raw-text': 'warn', contrast: 'error', 'missing-token': 'error', 'axis-collision': 'warn' } }
    expect(rawConfigSchema.parse(minimal).check).toEqual(defaults)
    expect(rawConfigSchema.parse({ ...minimal, check: {} }).check).toEqual(defaults)
    expect(rawConfigSchema.parse({ ...minimal, check: { contrast: 'AAA', rules: { 'raw-text': 'off' } } }).check).toEqual({
      ...defaults,
      contrast: 'AAA',
      rules: { ...defaults.rules, 'raw-text': 'off' },
    })
  })

  it('refuses drift off', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-config-'))
    try {
      await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...minimal, check: { rules: { drift: 'off' } } }))
      await expect(getRawConfig(cwd)).rejects.toThrow('components.json: check.rules.drift: cannot be off; use "warn"')
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })

  it('refuses an unknown rule, naming it', () => {
    const result = rawConfigSchema.safeParse({ ...minimal, check: { rules: { colours: 'off' } } })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path.join('.')).toBe('check.rules')
    expect(result.error?.issues[0]?.message).toContain('colours')
  })

  it('refuses an unknown key in the check block, naming it', () => {
    const result = rawConfigSchema.safeParse({ ...minimal, check: { standard: 'AAA' } })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path.join('.')).toBe('check')
    expect(result.error?.issues[0]?.message).toContain('standard')
  })

  it('refuses a standard it does not know', () => {
    expect(rawConfigSchema.safeParse({ ...minimal, check: { contrast: 'A' } }).success).toBe(false)
  })

  it('the served schema lists the check block', () => {
    const schema = JSON.parse(readFileSync(join(import.meta.dirname, '../../../registry/public/schema.json'), 'utf8'))
    expect(schema.properties.check.properties.contrast.enum).toEqual(['AA', 'AAA'])
    expect(schema.properties.check.properties.rules.properties.drift.enum).toEqual(['error', 'warn'])
    expect(Object.keys(schema.properties.check.properties.rules.properties)).toEqual(['drift', 'raw-text', 'contrast', 'missing-token', 'axis-collision'])
    expect(schema.properties.check.properties.rules.additionalProperties).toBe(false)
  })
})

describe('the resolved config', () => {
  let cwd: string
  afterEach(() => rm(cwd, { recursive: true, force: true }))

  it('is null without a components.json and names the file when it is broken', async () => {
    cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-config-'))
    expect(await getRawConfig(cwd)).toBeNull()
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...minimal, style: 'vega' }))
    await expect(getRawConfig(cwd)).rejects.toThrow(/components\.json.*bare/)
  })

  it('resolves every path from the aliases and the library', async () => {
    cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-config-'))
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./app/*'] } } }))
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...minimal, library: 'design/library', aliases: { ...minimal.aliases, ui: '@/components/ui', composables: '@/composables' } }))
    const config = await getConfig(cwd)
    expect(config?.resolvedPaths).toEqual({
      cwd,
      tailwindCss: join(cwd, 'assets/css/tailwind.css'),
      fronticCss: join(cwd, 'assets/css/frontic.css'),
      library: join(cwd, 'design/library'),
      brand: join(cwd, 'design/library/brand.json'),
      design: join(cwd, 'design/library/DESIGN.md'),
      recipes: join(cwd, 'design/library/recipes'),
      components: join(cwd, 'app/components'),
      ui: join(cwd, 'app/components/ui'),
      lib: join(cwd, 'app/lib'),
      composables: join(cwd, 'app/composables'),
    })
  })
})

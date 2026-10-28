import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runCheck } from '@/src/commands/check'
import { defaultBrand } from '@/src/library'
import { logger } from '@/src/utils/logger'

let cwd: string
const write = async (file: string, text: string) => {
  await mkdir(join(cwd, file, '..'), { recursive: true })
  await writeFile(join(cwd, file), text)
}
const components = (extra: object = {}) => JSON.stringify({ style: 'bare', tailwind: { css: 'assets/css/tailwind.css' }, aliases: { components: '@/components' }, ...extra })
const options = { strict: false, json: false }

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-check-command-'))
  await write('package.json', JSON.stringify({ name: 'shop' }))
  await write('tsconfig.json', JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } } }))
  await write('components.json', components())
  await write('library/brand.json', defaultBrand())
})

afterEach(() => rm(cwd, { recursive: true, force: true }))

describe('check', () => {
  it('exits 1 on an error and names the summary', async () => {
    await write('app/app.vue', '<template><NuxtPage /></template>\n')
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500" />\n</template>\n')
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {})
    try {
      const result = await runCheck({ cwd, ...options })
      expect(result.failed).toBe(true)
      expect(result.files).toBe(2)
      expect(log).toHaveBeenCalledWith('drift')
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^ {2}app\/pages\/index\.vue:2:\d+: /))
      expect(log).toHaveBeenLastCalledWith('check: 1 error, 0 warnings in 2 files')
    } finally {
      log.mockRestore()
    }
  }, 60_000)

  it('prints components: in DESIGN.md front matter as one warning that names the recipes folder, and passes', async () => {
    await write('library/DESIGN.md', '---\nname: Shop\ncomponents:\n  button:\n    base: {}\n---\n')
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {})
    try {
      expect((await runCheck({ cwd, ...options })).failed).toBe(false)
      expect(log.mock.calls.map((call) => call[0])).toEqual([
        'design-md',
        "  library/DESIGN.md: components: is not compiled; recipes live in each component's manifest and in library/recipes/",
        'check: 0 errors, 1 warning in 0 files',
      ])
    } finally {
      log.mockRestore()
    }
  }, 60_000)

  it('--contrast AAA overrides the file', async () => {
    expect((await runCheck({ cwd, ...options, json: true })).failed).toBe(false)
    const strict = await runCheck({ cwd, ...options, json: true, contrast: 'AAA' })
    expect(strict.failed).toBe(true)
    expect(strict.findings.every((f) => f.rule === 'contrast')).toBe(true)
    await write('components.json', components({ check: { contrast: 'AAA' } }))
    expect((await runCheck({ cwd, ...options, json: true, contrast: 'AA' })).failed).toBe(false)
  }, 60_000)

  it('an empty project passes and says it read 0 files', async () => {
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {})
    try {
      expect(await runCheck({ cwd, ...options })).toEqual({ findings: [], files: 0, failed: false, fixed: [] })
      expect(log).toHaveBeenLastCalledWith('check: 0 errors, 0 warnings in 0 files')
    } finally {
      log.mockRestore()
    }
  }, 60_000)

  it('warnings alone pass, and strict fails them', async () => {
    await write('components.json', components({ check: { rules: { drift: 'warn' } } }))
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500" />\n</template>\n')
    expect((await runCheck({ cwd, ...options, json: true })).failed).toBe(false)
    expect((await runCheck({ cwd, ...options, json: true, strict: true })).failed).toBe(true)
  }, 60_000)

  it('--json prints the findings', async () => {
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500" />\n</template>\n')
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      await runCheck({ cwd, ...options, json: true })
      const printed = JSON.parse(String(stdout.mock.calls.map((call) => call[0]).join('')))
      expect(printed).toEqual({ findings: [expect.objectContaining({ rule: 'drift', severity: 'error', where: expect.stringMatching(/^app\/pages\/index\.vue:2:/) })], files: 1 })
    } finally {
      stdout.mockRestore()
    }
  }, 60_000)

  it('--fix rewrites a component manifest whose keys run out of order, then finds nothing', async () => {
    await write('components/ui/chip/chip.json', JSON.stringify({ recipes: {}, title: 'Chip' }))
    expect((await runCheck({ cwd, ...options, json: true })).findings.map((f) => `${f.rule} ${f.file}`)).toEqual(['manifest components/ui/chip/chip.json'])
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {})
    try {
      const fixed = await runCheck({ cwd, ...options, fix: true })
      expect(fixed).toMatchObject({ findings: [], fixed: ['components/ui/chip/chip.json'] })
      expect(log).toHaveBeenCalledWith('fixed components/ui/chip/chip.json: keys in manifest order')
    } finally {
      log.mockRestore()
    }
    expect(Object.keys(JSON.parse(await readFile(join(cwd, 'components/ui/chip/chip.json'), 'utf8')))).toEqual(['$schema', 'title', 'recipes'])
  }, 60_000)

  it('needs a components.json', async () => {
    await rm(join(cwd, 'components.json'))
    await expect(runCheck({ cwd, ...options })).rejects.toThrow(/components\.json/)
  })
})

import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TIER_NAMES } from '@frontic/registry-client/api'
import { skillPath, writeSkill } from '@/src/commands/skill'

const skillFile = (skill: string) => join(import.meta.dirname, '../../../../skills', skill, 'SKILL.md')
const sources = { 'frontic-ui': skillFile('frontic-ui'), 'design-system': skillFile('design-system'), 'frontic-ui-review': skillFile('frontic-ui-review') }

describe('skillPath', () => {
  it.each([
    ['claude', '.claude/skills/frontic-ui/SKILL.md'],
    ['cursor', '.cursor/skills/frontic-ui/SKILL.md'],
    ['vscode', '.github/skills/frontic-ui/SKILL.md'],
    ['codex', '.codex/skills/frontic-ui/SKILL.md'],
    ['opencode', '.opencode/skills/frontic-ui/SKILL.md'],
  ] as const)('%s → %s', (client, expected) => {
    expect(skillPath(client, '/project')).toBe(`/project/${expected}`)
  })

  it('rejects an unknown client', () => {
    expect(() => skillPath('zed' as never, '/project')).toThrow(/claude, cursor, vscode, codex, opencode/)
  })
})

describe('writeSkill', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'frontic-skill-'))
  })

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  it('writes every bundled skill to the client path, creating directories', async () => {
    const written = await writeSkill({ client: 'cursor', cwd })
    expect(written).toEqual(Object.keys(sources).map((skill) => join(cwd, `.cursor/skills/${skill}/SKILL.md`)))
    for (const [i, source] of Object.values(sources).entries()) expect(await readFile(written[i]!, 'utf8')).toBe(await readFile(source, 'utf8'))
  })

  it('overwrites an existing copy', async () => {
    const target = join(cwd, '.claude/skills/frontic-ui/SKILL.md')
    await mkdir(join(cwd, '.claude/skills/frontic-ui'), { recursive: true })
    await writeFile(target, 'stale\n')
    await writeSkill({ client: 'claude', cwd })
    expect(await readFile(target, 'utf8')).toBe(await readFile(sources['frontic-ui'], 'utf8'))
  })

  it('rejects an unknown client', async () => {
    await expect(writeSkill({ client: 'zed' as never, cwd })).rejects.toThrow(/Unknown client: zed/)
  })
})

describe('skill text', () => {
  it('lists every search tier', async () => {
    const text = await readFile(sources['frontic-ui'], 'utf8')
    expect(text).toContain(`--tier ${TIER_NAMES.join('\\|')}`)
    expect(text).toContain(`filters ${TIER_NAMES.join(' / ')}`)
  })

  it.each(Object.entries(sources))('%s reads markdown from docs, not view', async (_, path) => {
    expect(await readFile(path, 'utf8')).not.toMatch(/`view`'s|of `view`/)
  })
})

import { join } from 'node:path'
import prompts from 'prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOptionsSchema, runCreate, type CreateOptions } from '@/src/commands/create'
import { runInit } from '@/src/commands/init'
import { runMcp } from '@/src/commands/mcp'
import { writeSkill } from '@/src/commands/skill'
import { createProject } from '@/src/utils/create-project'
import { logger } from '@/src/utils/logger'

vi.mock('prompts', () => ({ default: vi.fn() }))
vi.mock('@/src/utils/create-project', () => ({
  createProject: vi.fn(async ({ cwd, name, template }: { cwd: string; name?: string; template?: string }) => ({ projectPath: join(cwd, name!), projectName: name, template })),
}))
vi.mock('@/src/commands/init', async (original) => ({ ...(await original<typeof import('@/src/commands/init')>()), runInit: vi.fn(async () => ({ config: {}, written: [], kept: [] })) }))
vi.mock('@/src/commands/mcp', async (original) => ({ ...(await original<typeof import('@/src/commands/mcp')>()), runMcp: vi.fn(async () => '.cursor/mcp.json') }))
vi.mock('@/src/commands/skill', async (original) => ({
  ...(await original<typeof import('@/src/commands/skill')>()),
  writeSkill: vi.fn(async () => ['/project/.cursor/skills/frontic-ui/SKILL.md', '/project/.cursor/skills/design-system/SKILL.md']),
}))

const cwd = '/tmp/projects'
const project = join(cwd, 'shop')
const options = (overrides: Partial<CreateOptions> = {}): CreateOptions => ({ cwd, name: 'shop', template: 'vite', yes: true, defaults: true, force: false, silent: true, ...overrides })

const tty = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
const setTty = (value: boolean) => Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })

beforeEach(() => {
  vi.spyOn(logger, 'info').mockImplementation(() => {})
  vi.spyOn(logger, 'break').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
  if (tty) Object.defineProperty(process.stdin, 'isTTY', tty)
  else delete (process.stdin as { isTTY?: boolean }).isTTY
})

describe('runCreate', () => {
  it('scaffolds, runs init in the project, then mcp and skill for --client', async () => {
    setTty(false)
    const result = await runCreate(options({ client: 'cursor', iconLibrary: 'tabler' }))

    expect(createProject).toHaveBeenCalledWith({ cwd, name: 'shop', template: 'vite', force: false })
    expect(runInit).toHaveBeenCalledWith(expect.objectContaining({ cwd: project, name: 'shop', template: 'vite', iconLibrary: 'tabler', defaults: true, silent: true }))
    expect(runMcp).toHaveBeenCalledWith({ client: 'cursor', cwd: project })
    expect(writeSkill).toHaveBeenCalledWith({ client: 'cursor', cwd: project })
    expect(prompts).not.toHaveBeenCalled()
    expect(result).toEqual({ projectPath: project, projectName: 'shop', client: 'cursor' })

    const order = [vi.mocked(createProject), vi.mocked(runInit), vi.mocked(runMcp), vi.mocked(writeSkill)].map((fn) => fn.mock.invocationCallOrder[0]!)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('asks which client to set up on a terminal', async () => {
    setTty(true)
    vi.mocked(prompts).mockResolvedValueOnce({ client: 'claude' })

    const result = await runCreate(options())

    expect(prompts).toHaveBeenCalledWith(expect.objectContaining({ type: 'select', message: 'Set up an AI client?' }))
    const choices = (vi.mocked(prompts).mock.calls[0]![0] as { choices: { value: string }[] }).choices.map((choice) => choice.value)
    expect(choices).toEqual(['claude', 'cursor', 'vscode', 'codex', 'opencode', 'none'])
    expect(runMcp).toHaveBeenCalledWith({ client: 'claude', cwd: project })
    expect(writeSkill).toHaveBeenCalledWith({ client: 'claude', cwd: project })
    expect(result.client).toBe('claude')
  })

  it('sets up nothing when the answer is none', async () => {
    setTty(true)
    vi.mocked(prompts).mockResolvedValueOnce({ client: 'none' })

    const result = await runCreate(options())

    expect(runMcp).not.toHaveBeenCalled()
    expect(writeSkill).not.toHaveBeenCalled()
    expect(result.client).toBeNull()
  })

  it('skips mcp and skill without a terminal and says so', async () => {
    setTty(false)

    const result = await runCreate(options({ silent: false }))

    expect(prompts).not.toHaveBeenCalled()
    expect(runMcp).not.toHaveBeenCalled()
    expect(writeSkill).not.toHaveBeenCalled()
    expect(result.client).toBeNull()
    expect(vi.mocked(logger.info).mock.calls.map((call) => call.join(' '))).toContainEqual(expect.stringMatching(/No terminal.*mcp --client.*skills --client/s))
  })

  it('rejects an unknown client before scaffolding', () => {
    expect(() => createOptionsSchema.parse(options({ client: 'zed' as never }))).toThrow()
  })
})

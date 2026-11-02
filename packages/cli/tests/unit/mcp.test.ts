import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { MCP_CLIENTS, runMcp } from '@/src/commands/mcp'
import { logger } from '@/src/utils/logger'

describe('the MCP clients', () => {
  it('keep each client’s server in a project file, and Codex’s in its global config', () => {
    expect(MCP_CLIENTS.map((client) => [client.name, client.scope, client.configPath])).toEqual([
      ['claude', 'project', '.mcp.json'],
      ['cursor', 'project', '.cursor/mcp.json'],
      ['vscode', 'project', '.vscode/mcp.json'],
      ['codex', 'global', '~/.codex/config.toml'],
      ['opencode', 'project', 'opencode.json'],
    ])
  })

  it('write nothing for a client with a global config, and print its file and snippet instead', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mcp-'))
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {})
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    expect(await runMcp({ client: 'codex', cwd })).toBeNull()
    expect(existsSync(join(cwd, '.codex'))).toBe(false)
    expect(log.mock.calls.flat().join('\n')).toContain('~/.codex/config.toml')
    expect(info.mock.calls.flat().join('\n')).toContain('[mcp_servers.frontic_ui]')
  })
})

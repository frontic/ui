// No alias imports and no fs: the ui site renders each client's setup from this module.

const REMOTE_MCP_URL = 'https://mcp.ui.frontic.com/mcp'

/** Each client `mcp` sets up: where it keeps its MCP servers, in the project or once for the user, and the server's entry there. */
export const MCP_CLIENTS = [
  {
    name: 'claude',
    label: 'Claude Code',
    configPath: '.mcp.json',
    scope: 'project',
    config: {
      mcpServers: {
        'frontic-ui': {
          type: 'http',
          url: REMOTE_MCP_URL,
        },
      },
    },
  },
  {
    name: 'cursor',
    label: 'Cursor',
    configPath: '.cursor/mcp.json',
    scope: 'project',
    config: {
      mcpServers: {
        'frontic-ui': {
          command: 'npx',
          args: ['mcp-remote', REMOTE_MCP_URL],
        },
      },
    },
  },
  {
    name: 'vscode',
    label: 'VS Code',
    configPath: '.vscode/mcp.json',
    scope: 'project',
    config: {
      servers: {
        'frontic-ui': {
          type: 'http',
          url: REMOTE_MCP_URL,
        },
      },
    },
  },
  {
    name: 'codex',
    label: 'Codex',
    configPath: '~/.codex/config.toml',
    scope: 'global',
    config: `[mcp_servers.frontic_ui]
command = "npx"
args = ["mcp-remote", "${REMOTE_MCP_URL}"]
`,
  },
  {
    name: 'opencode',
    label: 'Opencode',
    configPath: 'opencode.json',
    scope: 'project',
    config: {
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        'frontic-ui': {
          type: 'remote',
          enabled: true,
          url: REMOTE_MCP_URL,
        },
      },
    },
  },
] as const

export type McpClient = (typeof MCP_CLIENTS)[number]['name']

export const MCP_CLIENT_NAMES = MCP_CLIENTS.map((client) => client.name) as [McpClient, ...McpClient[]]


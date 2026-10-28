import { promises as fs } from 'node:fs'
import { Command } from 'commander'
import deepmerge from 'deepmerge'
import fsExtra from 'fs-extra'
import path from 'pathe'
import prompts from 'prompts'
import z from 'zod'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { spinner } from '@/src/utils/spinner'

const REMOTE_MCP_URL = 'https://mcp.ui.frontic.com/mcp'

export const MCP_CLIENTS = [
  {
    name: 'claude',
    label: 'Claude Code',
    configPath: '.mcp.json',
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
    configPath: '.codex/config.toml',
    config: `[mcp_servers.frontic_ui]
command = "npx"
args = ["mcp-remote", "${REMOTE_MCP_URL}"]
`,
  },
  {
    name: 'opencode',
    label: 'Opencode',
    configPath: 'opencode.json',
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

const mcpInitOptionsSchema = z.object({
  client: z.enum(MCP_CLIENT_NAMES),
  cwd: z.string(),
})

export const mcp = new Command()
  .name('mcp')
  .description('add the Frontic UI MCP server to your AI coding client')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('--client <client>', `MCP client (${MCP_CLIENT_NAMES.join(', ')})`)
  .action(async (opts) => {
    try {
      let client = opts.client
      const cwd = opts.cwd || process.cwd()

      if (!client) {
        if (!process.stdin.isTTY) throw new Error(`--client is required without a terminal. Available clients: ${MCP_CLIENT_NAMES.join(', ')}`)
        const response = await prompts({
          type: 'select',
          name: 'client',
          message: 'Which MCP client are you using?',
          choices: MCP_CLIENTS.map((c) => ({ title: c.label, value: c.name })),
        })

        if (!response.client) {
          logger.break()
          process.exit(1)
        }

        client = response.client
      }

      await runMcp(mcpInitOptionsSchema.parse({ client, cwd }))
    } catch (error) {
      handleError(error)
    }
  })

/** Registers the hosted MCP server with the client: its project config file is written and returned; Codex keeps a global config, so its snippet is printed and null returned. */
export async function runMcp(options: z.infer<typeof mcpInitOptionsSchema>): Promise<string | null> {
  const clientInfo = MCP_CLIENTS.find((c) => c.name === options.client)
  if (!clientInfo) throw new Error(`Unknown client: ${options.client}. Available clients: ${MCP_CLIENT_NAMES.join(', ')}`)

  if (options.client === 'codex') {
    logger.break()
    logger.log('To configure the Frontic UI MCP server in Codex:')
    logger.break()
    logger.log(`1. Open or create the file ${highlighter.info('~/.codex/config.toml')}`)
    logger.log('2. Add the following configuration:')
    logger.log()
    logger.info(clientInfo.config as string)
    logger.break()
    logger.info('3. Restart Codex to load the MCP server')
    logger.break()
    return null
  }

  const configSpinner = spinner('Configuring MCP server...').start()
  const configPath = await writeMcpConfig(options)
  configSpinner.succeed('Configuring MCP server.')

  logger.break()
  logger.success(`Configuration saved to ${configPath}.`)
  logger.info('Using hosted remote server — no local dependencies needed.')
  logger.break()
  return configPath
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const overwriteMerge = (_destArray: any[], sourceArray: any[]) => sourceArray

async function writeMcpConfig(options: z.infer<typeof mcpInitOptionsSchema>) {
  const { client, cwd } = options

  const clientInfo = MCP_CLIENTS.find((c) => c.name === client)
  if (!clientInfo) throw new Error(`Unknown client: ${client}. Available clients: ${MCP_CLIENT_NAMES.join(', ')}`)

  const configPath = path.join(cwd, clientInfo.configPath)
  const dir = path.dirname(configPath)
  await fsExtra.ensureDir(dir)

  let existingConfig = {}
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    existingConfig = JSON.parse(content)
  } catch {
    // Config file doesn't exist yet, use empty object
  }

  const mergedConfig = deepmerge(existingConfig, clientInfo.config as Record<string, unknown>, { arrayMerge: overwriteMerge })

  await fs.writeFile(configPath, `${JSON.stringify(mergedConfig, null, 2)}\n`, 'utf-8')

  return clientInfo.configPath
}

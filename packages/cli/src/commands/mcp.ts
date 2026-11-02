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
import { MCP_CLIENT_NAMES, MCP_CLIENTS } from '@/src/mcp-clients'

export { MCP_CLIENT_NAMES, MCP_CLIENTS, type McpClient } from '@/src/mcp-clients'

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

/** Registers the hosted MCP server with the client: its project config file is written and returned; a client with a global config gets its file and snippet printed, and null returned. */
export async function runMcp(options: z.infer<typeof mcpInitOptionsSchema>): Promise<string | null> {
  const clientInfo = MCP_CLIENTS.find((c) => c.name === options.client)
  if (!clientInfo) throw new Error(`Unknown client: ${options.client}. Available clients: ${MCP_CLIENT_NAMES.join(', ')}`)

  if (clientInfo.scope === 'global') {
    logger.break()
    logger.log(`To configure the Frontic UI MCP server in ${clientInfo.label}:`)
    logger.break()
    logger.log(`1. Open or create the file ${highlighter.info(clientInfo.configPath)}`)
    logger.log('2. Add the following configuration:')
    logger.log()
    logger.info(clientInfo.config as string)
    logger.break()
    logger.info(`3. Restart ${clientInfo.label} to load the MCP server`)
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

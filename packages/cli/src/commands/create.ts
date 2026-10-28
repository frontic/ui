import { Command } from 'commander'
import path from 'pathe'
import prompts from 'prompts'
import validateProjectName from 'validate-npm-package-name'
import { z } from 'zod'
import { initOptionsSchema, runInit } from '@/src/commands/init'
import { MCP_CLIENT_NAMES, MCP_CLIENTS, runMcp, type McpClient } from '@/src/commands/mcp'
import { writeSkill } from '@/src/commands/skill'
import { ICON_LIBRARIES } from '@/src/constants'
import { createProject } from '@/src/utils/create-project'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

export const createOptionsSchema = z.object({
  cwd: z.string(),
  name: z.string().optional(),
  template: z.string().optional(),
  iconLibrary: z.string().optional(),
  library: z.string().optional(),
  client: z.enum([...MCP_CLIENT_NAMES, 'none']).optional(),
  yes: z.boolean(),
  defaults: z.boolean(),
  force: z.boolean(),
  silent: z.boolean(),
})

export type CreateOptions = z.infer<typeof createOptionsSchema>

export interface CreateReport {
  projectPath: string
  projectName: string
  /** The client mcp and skill were set up for; null when none was. */
  client: McpClient | null
}

export const create = new Command()
  .name('create')
  .description('create a new project, then run init, mcp and skills')
  .argument('[name]', 'the name of the project')
  .option('-t, --template <template>', 'project template. (nuxt, vite, vite-router)')
  .option('--icon-library <name>', `the icon library. (${ICON_LIBRARIES.map((library) => library.name).join(', ')})`)
  .option('--library <path>', 'where brand.json, DESIGN.md and recipes/, the shared recipes, live. (library)')
  .option('--client <client>', `the AI client to set up, or none. (${MCP_CLIENT_NAMES.join(', ')})`)
  .option('-y, --yes', 'skip confirmation prompt.', true)
  .option('-d, --defaults', 'use default configuration.', false)
  .option('-f, --force', 'force overwrite of existing configuration.', false)
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('-s, --silent', 'mute output.', false)
  .action(async (name, opts) => {
    try {
      const options = createOptionsSchema.parse({ ...opts, cwd: path.resolve(opts.cwd), name })

      let projectName = options.name
      if (!projectName) {
        const { name: promptedName } = await prompts({
          type: 'text',
          name: 'name',
          message: 'What is your project named?',
          initial: 'my-app',
          format: (value: string) => value.trim(),
          validate: (value: string) => {
            if (value.length > 128) return 'Name should be less than 128 characters.'
            const result = validateProjectName(value)
            return result.validForNewPackages ? true : `Invalid project name: ${(result.errors || result.warnings || []).join(', ')}`
          },
        })
        projectName = promptedName
      }
      if (!projectName) throw new Error('Project name is required.')

      const report = await runCreate({ ...options, name: projectName })

      logger.log(`${highlighter.success('Success!')} Project "${report.projectName}" created with Frontic UI.\n`)
      logger.info('Next steps:')
      logger.info(`  cd ${report.projectName}`)
      logger.info(`  ${highlighter.info('npx @frontic/ui add button')}`)
      logger.break()
    } catch (error) {
      logger.break()
      handleError(error)
    }
  })

/** The client to set up: --client, the answer on a terminal, or none without one. */
async function chooseClient(options: CreateOptions): Promise<McpClient | null> {
  if (options.client) return options.client === 'none' ? null : options.client
  if (!process.stdin.isTTY) {
    if (!options.silent) logger.info(`No terminal, so no AI client was set up. In the project, run ${highlighter.info('npx @frontic/ui mcp --client <client>')} and ${highlighter.info('npx @frontic/ui skills --client <client>')}.`)
    return null
  }
  const { client } = await prompts({
    type: 'select',
    name: 'client',
    message: 'Set up an AI client?',
    choices: [...MCP_CLIENTS.map((entry) => ({ title: entry.label, value: entry.name })), { title: 'None', value: 'none' }],
    initial: 0,
  })
  return client && client !== 'none' ? (client as McpClient) : null
}

/** Scaffolds the project, runs init in it, then registers the MCP server and installs the skill for the chosen client. */
export async function runCreate(options: CreateOptions): Promise<CreateReport> {
  const { projectPath, projectName } = await createProject({ cwd: options.cwd, force: options.force, name: options.name, template: options.template })
  await runInit(initOptionsSchema.parse({ ...options, name: projectName, cwd: projectPath }))
  const client = await chooseClient(options)
  if (client) {
    await runMcp({ client, cwd: projectPath })
    const skills = await writeSkill({ client, cwd: projectPath })
    if (!options.silent) for (const file of skills) logger.success(`Skill written to ${path.relative(projectPath, file)}.`)
  }
  return { projectPath, projectName, client }
}

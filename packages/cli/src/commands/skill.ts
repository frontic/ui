import { existsSync, promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import path from 'pathe'
import prompts from 'prompts'
import { handleError } from '@/src/utils/handle-error'
import { logger } from '@/src/utils/logger'

const CLIENTS = [
  { name: 'claude', label: 'Claude Code', skillsDir: '.claude/skills' },
  { name: 'cursor', label: 'Cursor', skillsDir: '.cursor/skills' },
  { name: 'vscode', label: 'VS Code', skillsDir: '.github/skills' },
  { name: 'codex', label: 'Codex', skillsDir: '.codex/skills' },
  { name: 'opencode', label: 'Opencode', skillsDir: '.opencode/skills' },
] as const

/** The skills every client gets: the daily rules, the one that builds a brand's library from a source, and the review brief for a subagent. */
export const SKILLS = ['frontic-ui', 'design-system', 'frontic-ui-review'] as const

export type SkillClient = (typeof CLIENTS)[number]['name']
export type SkillName = (typeof SKILLS)[number]

const clientNames = CLIENTS.map((c) => c.name).join(', ')

// The bundle ships the skills beside dist/index.js; from source the repo files are used.
const skillSources = (skill: SkillName) => [new URL(`./skills/${skill}/SKILL.md`, import.meta.url), new URL(`../../../../skills/${skill}/SKILL.md`, import.meta.url)]

function clientInfo(client: SkillClient) {
  const info = CLIENTS.find((c) => c.name === client)
  if (!info) throw new Error(`Unknown client: ${client}. Available clients: ${clientNames}`)
  return info
}

export function skillPath(client: SkillClient, cwd: string, skill: SkillName = 'frontic-ui') {
  return path.join(cwd, clientInfo(client).skillsDir, skill, 'SKILL.md')
}

function skillSource(skill: SkillName) {
  const source = skillSources(skill)
    .map((url) => fileURLToPath(url))
    .find((file) => existsSync(file))
  if (!source) throw new Error(`${skill}/SKILL.md is missing from this @frontic/ui install`)
  return source
}

/** Writes every skill for the client; the paths written, in SKILLS order. */
export async function writeSkill({ client, cwd }: { client: SkillClient; cwd: string }) {
  const written: string[] = []
  for (const skill of SKILLS) {
    const target = skillPath(client, cwd, skill)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.copyFile(skillSource(skill), target)
    written.push(target)
  }
  return written
}

export const skill = new Command()
  .name('skills')
  .alias('skill')
  .description('install the Frontic UI skills for your AI coding client')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('--client <client>', `AI client (${clientNames})`)
  .action(async (opts: { client?: string; cwd: string }) => {
    try {
      let client = opts.client
      const cwd = opts.cwd || process.cwd()

      if (!client) {
        if (!process.stdin.isTTY) throw new Error(`--client is required without a terminal. Available clients: ${clientNames}`)
        const response = await prompts({
          type: 'select',
          name: 'client',
          message: 'Which AI client are you using?',
          choices: CLIENTS.map((c) => ({ title: c.label, value: c.name })),
        })
        if (!response.client) {
          logger.break()
          process.exit(1)
        }
        client = response.client
      }

      const written = await writeSkill({ client: client as SkillClient, cwd })
      for (const file of written) logger.success(`Skill written to ${path.relative(cwd, file)}.`)
    } catch (error) {
      handleError(error)
    }
  })

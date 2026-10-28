import { Command } from 'commander'
import path from 'pathe'
import { z } from 'zod'
import { FINDING_RULES, type Finding, runChecks } from '@/src/check'
import { fixManifestOrder } from '@/src/library'
import { getConfig } from '@/src/utils/get-config'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

const checkOptionsSchema = z.object({ cwd: z.string(), strict: z.boolean(), contrast: z.enum(['AA', 'AAA']).optional(), json: z.boolean(), fix: z.boolean().default(false) })

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/** Runs every check the project's components.json asks for and prints the findings by rule; `failed` when any is an error. `fix` first
 * rewrites each component manifest whose keys run out of order. */
export async function runCheck(options: z.input<typeof checkOptionsSchema>): Promise<{ findings: Finding[]; files: number; failed: boolean; fixed: string[] }> {
  const config = await getConfig(options.cwd)
  if (!config) throw new Error(`No components.json at ${options.cwd}. Run ${highlighter.info('npx @frontic/ui init')} first.`)
  const fixed = options.fix ? await fixManifestOrder(config) : []
  if (!options.json) for (const file of fixed) logger.log(`fixed ${file}: keys in manifest order`)
  const { findings, files } = await runChecks(config, { contrast: options.contrast, strict: options.strict })
  const errors = findings.filter((f) => f.severity === 'error').length
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ findings, files, ...(options.fix ? { fixed } : {}) }, null, 2)}\n`)
  } else {
    for (const rule of FINDING_RULES) {
      const found = findings.filter((f) => f.rule === rule)
      if (!found.length) continue
      logger.log(rule)
      for (const f of found) logger.log(`  ${f.where}: ${f.message}`)
    }
    logger.log(`check: ${count(errors, 'error')}, ${count(findings.length - errors, 'warning')} in ${count(files, 'file')}`)
  }
  return { findings, files, failed: errors > 0, fixed }
}

export const check = new Command()
  .name('check')
  .description('lint the project against its brand: classes outside the theme, raw text in items, contrast, recipe tokens the brand lacks, variant values that collide, component manifests whose keys run out of order and shared recipes an element wears that no tree composes')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('--strict', 'treat every warning as an error.', false)
  .option('--contrast <level>', 'the WCAG level for this run: AA or AAA. overrides components.json.')
  .option('--json', 'output as JSON; each finding names its file, and its recipe when it is about one.', false)
  .option('--fix', 'rewrite each component manifest whose keys run out of order, then check.', false)
  .action(async (opts) => {
    try {
      const { failed } = await runCheck(checkOptionsSchema.parse({ ...opts, cwd: path.resolve(opts.cwd) }))
      if (failed) process.exitCode = 1
    } catch (error) {
      handleError(error)
    }
  })

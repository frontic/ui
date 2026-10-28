import { Command } from 'commander'
import path from 'pathe'
import { z } from 'zod'
import { installItems } from '@/src/install'
import { preFlightAdd } from '@/src/preflights/preflight-add'
import * as ERRORS from '@/src/utils/errors'
import { tailwindOutdated } from '@/src/utils/get-project-info'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

export const addOptionsSchema = z.object({
  items: z.array(z.string()).min(1),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  silent: z.boolean(),
  dryRun: z.boolean(),
  diff: z.boolean(),
})

export const add = new Command()
  .name('add')
  .description('install items and their dependencies, write each component\'s manifest with its recipes beside its files and the shared recipes into library/recipes/, and recompile frontic.css')
  .argument('<items...>', 'item names')
  .option('-y, --yes', 'keep a differing file without asking.', false)
  .option('-o, --overwrite', 'replace installed files that differ, recipes you edited and a manifest\'s title and description; other recipes in a file stay.', false)
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('-s, --silent', 'mute output.', false)
  .option('--dry-run', 'print what would change without writing.', false)
  .option('--diff', 'print the file diffs without writing.', false)
  .action(async (items: string[], opts) => {
    try {
      const options = addOptionsSchema.parse({ items, ...opts, cwd: path.resolve(opts.cwd) })
      const { errors, config, tailwindBelowFloor } = await preFlightAdd(options)
      if (errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT]) throw new Error(`No package.json at ${options.cwd}. Run ${highlighter.info('npx @frontic/ui create')} for a new project.`)
      if (errors[ERRORS.TAILWIND_OUTDATED]) throw new Error(tailwindOutdated(tailwindBelowFloor!))
      if (errors[ERRORS.MISSING_CONFIG] || !config) throw new Error(`No components.json at ${options.cwd}. Run ${highlighter.info('npx @frontic/ui init')} first.`)
      await installItems(options.items, config, options)
    } catch (error) {
      logger.break()
      handleError(error)
    }
  })

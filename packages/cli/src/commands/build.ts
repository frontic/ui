import { Command } from 'commander'
import path from 'pathe'
import { z } from 'zod'
import { type Finding, runChecks } from '@/src/check'
import { compileStylesheet, installFonts } from '@/src/library'
import { getConfig } from '@/src/utils/get-config'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { skipInstall } from '@/src/utils/updaters/update-dependencies'

const buildOptionsSchema = z.object({ cwd: z.string(), silent: z.boolean() })

/** Installs the font packages the brand names that package.json lacks, compiles frontic.css, which imports them, and warns about every `check` finding. */
export async function runBuild(options: z.infer<typeof buildOptionsSchema>) {
  const config = await getConfig(options.cwd)
  if (!config) throw new Error(`No components.json at ${options.cwd}. Run ${highlighter.info('npx @frontic/ui init')} first.`)
  const fonts = await installFonts(config, { silent: options.silent })
  const stylesheet = await compileStylesheet(config)
  // The checks report; a failure to run them never fails the build.
  let findings: Finding[] = []
  let checkError: string | null = null
  try {
    findings = (await runChecks(config, {})).findings
  } catch (error) {
    checkError = error instanceof Error ? error.message : String(error)
  }
  if (!options.silent) {
    const file = path.relative(options.cwd, stylesheet.path)
    logger.info(stylesheet.written ? `Wrote ${file}` : `${file} is current`)
    if (fonts.length && !skipInstall()) logger.info(`Installed ${fonts.join(', ')}`)
    for (const warning of stylesheet.warnings) logger.warn(warning)
    for (const finding of findings) logger.warn(`${finding.rule}: ${finding.where}: ${finding.message}`)
    if (checkError) logger.warn(`check could not run: ${checkError}`)
  }
  return { stylesheet, fonts, findings }
}

export const build = new Command()
  .name('build')
  .description('compile brand.json, each component manifest\'s recipes and the shared recipes in library/recipes/ into frontic.css, warn about every check finding and install the font packages the brand names')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('-s, --silent', 'mute output.', false)
  .action(async (opts) => {
    try {
      await runBuild(buildOptionsSchema.parse({ ...opts, cwd: path.resolve(opts.cwd) }))
    } catch (error) {
      handleError(error)
    }
  })

import fs from 'fs-extra'
import path from 'pathe'
import * as ERRORS from '@/src/utils/errors'
import { getProjectInfo, tailwindOutdated, type ProjectInfo } from '@/src/utils/get-project-info'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { spinner } from '@/src/utils/spinner'

export async function preFlightInit(options: { cwd: string; force: boolean; silent: boolean }): Promise<{ errors: Record<string, boolean>; projectInfo: ProjectInfo | null }> {
  const errors: Record<string, boolean> = {}

  // No package.json means no project: the caller creates one.
  if (!fs.existsSync(options.cwd) || !fs.existsSync(path.resolve(options.cwd, 'package.json'))) {
    errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true
    return { errors, projectInfo: null }
  }

  const projectSpinner = spinner('Preflight checks.', { silent: options.silent }).start()
  if (fs.existsSync(path.resolve(options.cwd, 'components.json')) && !options.force) {
    projectSpinner.fail()
    logger.break()
    logger.error(`A ${highlighter.info('components.json')} file already exists at ${highlighter.info(options.cwd)}.\nRun ${highlighter.info('init --force')} to write it again.`)
    logger.break()
    process.exit(1)
  }
  projectSpinner.succeed()

  const frameworkSpinner = spinner('Verifying framework.', { silent: options.silent }).start()
  const projectInfo = await getProjectInfo(options.cwd)
  if (projectInfo.framework.name === 'manual') {
    errors[ERRORS.UNSUPPORTED_FRAMEWORK] = true
    frameworkSpinner.fail()
    logger.break()
    logger.error(`We could not detect a supported framework at ${highlighter.info(options.cwd)}.`)
    logger.break()
    process.exit(1)
  }
  frameworkSpinner.succeed(`Verifying framework. Found ${highlighter.info(projectInfo.framework.label)}.`)

  const tailwindSpinner = spinner('Validating Tailwind CSS.', { silent: options.silent }).start()
  if (projectInfo.tailwindVersion === 'v3') {
    errors[ERRORS.TAILWIND_V3] = true
    tailwindSpinner.fail()
  } else if (projectInfo.tailwindVersion !== 'v4' || !projectInfo.tailwindCssFile) {
    errors[ERRORS.TAILWIND_NOT_CONFIGURED] = true
    tailwindSpinner.fail()
  } else if (projectInfo.tailwindBelowFloor) {
    errors[ERRORS.TAILWIND_OUTDATED] = true
    tailwindSpinner.fail()
  } else {
    tailwindSpinner.succeed(`Validating Tailwind CSS. Found ${highlighter.info('v4')}.`)
  }

  const tsConfigSpinner = spinner('Validating import alias.', { silent: options.silent }).start()
  if (!projectInfo.aliasPrefix) {
    errors[ERRORS.IMPORT_ALIAS_MISSING] = true
    tsConfigSpinner.fail()
  } else {
    tsConfigSpinner.succeed()
  }

  if (Object.keys(errors).length > 0) {
    logger.break()
    if (errors[ERRORS.TAILWIND_V3]) logger.error('Frontic UI needs Tailwind CSS v4.')
    if (errors[ERRORS.TAILWIND_NOT_CONFIGURED]) logger.error(`No Tailwind CSS v4 found at ${highlighter.info(options.cwd)}: install tailwindcss and import it from your global CSS, then try again.`)
    if (errors[ERRORS.TAILWIND_OUTDATED]) logger.error(tailwindOutdated(projectInfo.tailwindBelowFloor!))
    if (errors[ERRORS.IMPORT_ALIAS_MISSING]) logger.error('No import alias found in your tsconfig.json file.')
    logger.break()
    process.exit(1)
  }

  return { errors, projectInfo }
}

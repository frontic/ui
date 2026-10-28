import fs from 'fs-extra'
import path from 'pathe'
import * as ERRORS from '@/src/utils/errors'
import { getConfig, type Config } from '@/src/utils/get-config'
import { getTailwindBelowFloor } from '@/src/utils/get-project-info'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

export async function preFlightAdd(options: { cwd: string }): Promise<{ errors: Record<string, boolean>; config: Config | null; tailwindBelowFloor?: string | null }> {
  const errors: Record<string, boolean> = {}

  if (!fs.existsSync(options.cwd) || !fs.existsSync(path.resolve(options.cwd, 'package.json'))) {
    errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true
    return { errors, config: null }
  }

  if (!fs.existsSync(path.resolve(options.cwd, 'components.json'))) {
    errors[ERRORS.MISSING_CONFIG] = true
    return { errors, config: null }
  }

  const tailwindBelowFloor = getTailwindBelowFloor(options.cwd)
  if (tailwindBelowFloor) {
    errors[ERRORS.TAILWIND_OUTDATED] = true
    return { errors, config: null, tailwindBelowFloor }
  }

  try {
    return { errors, config: await getConfig(options.cwd) }
  } catch (error) {
    logger.break()
    logger.error(`An invalid ${highlighter.info('components.json')} file was found at ${highlighter.info(options.cwd)}.`)
    logger.error((error as Error).message)
    logger.error(`Run ${highlighter.info('init --force')} to write a valid one.`)
    logger.break()
    process.exit(1)
  }
}

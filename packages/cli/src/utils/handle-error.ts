import { z } from 'zod'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

export function handleError(error: unknown): never {
  logger.break()
  if (typeof error === 'string') {
    logger.error(error)
  } else if (error instanceof z.ZodError) {
    logger.error('Validation failed:')
    for (const [key, value] of Object.entries(error.flatten().fieldErrors)) logger.error(`- ${highlighter.info(key)}: ${value}`)
  } else if (error instanceof Error) {
    logger.error(error.message)
  } else {
    logger.error('Something went wrong.')
  }
  logger.break()
  process.exit(1)
}

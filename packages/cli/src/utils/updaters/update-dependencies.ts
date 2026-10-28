import { addDependency } from 'nypm'
import type { Config } from '@/src/schema'
import { logger } from '@/src/utils/logger'
import { spinner } from '@/src/utils/spinner'

/** Whether installs are only announced: FRONTIC_SKIP_INSTALL=1 in the environment. */
export const skipInstall = () => process.env.FRONTIC_SKIP_INSTALL === '1'

/** Installs the packages with the project's package manager; with FRONTIC_SKIP_INSTALL=1 it prints what it would install instead. */
export async function updateDependencies(dependencies: string[] | undefined, config: Config, options: { silent?: boolean; dev?: boolean } = {}) {
  const packages = [...new Set(dependencies ?? [])]
  if (!packages.length) return
  if (skipInstall()) {
    logger.info(`Would install${options.dev ? ' (dev)' : ''}: ${packages.join(', ')}`)
    return
  }
  const dependenciesSpinner = spinner(`Installing ${options.dev ? 'dev ' : ''}dependencies.`, { silent: options.silent }).start()
  await addDependency(packages, { cwd: config.resolvedPaths.cwd, silent: true, dev: options.dev ?? false }).catch((error: unknown) => {
    dependenciesSpinner.fail()
    throw error
  })
  dependenciesSpinner.succeed()
}

import { existsSync, promises as fs, statSync } from 'node:fs'
import path from 'pathe'
import prompts from 'prompts'
import type { IconMap, RegistryFile } from '@frontic/registry-client'
import type { Config } from '@/src/schema'
import { isContentSame } from '@/src/utils/compare'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { spinner } from '@/src/utils/spinner'
import { transform } from '@/src/utils/transformers'

export interface FileReport {
  filesCreated: string[]
  filesUpdated: string[]
  filesSkipped: string[]
}

const PLACES = [
  ['components/ui/', 'ui'],
  ['components/', 'components'],
  ['lib/', 'lib'],
  ['composables/', 'composables'],
] as const

/** Where a registry file lands: under the alias its first folder names, `components/ui/…` under the ui alias. */
export function resolveFilePath(file: Pick<RegistryFile, 'path'>, config: Config) {
  const [prefix, place] = PLACES.find(([prefix]) => file.path.startsWith(prefix)) ?? ['', 'components']
  const target = path.join(config.resolvedPaths[place], file.path.slice(prefix.length))
  return config.typescript ? target : target.replace(/\.ts$/, '.js')
}

/** A registry file as it will be written to the project. */
export async function installedContent(file: RegistryFile, config: Config, iconMap: IconMap) {
  return transform({ filename: file.path, raw: file.content, config, iconMap })
}

export async function updateFiles(files: RegistryFile[], config: Config, options: { overwrite?: boolean; yes?: boolean; silent?: boolean; iconMap: IconMap }): Promise<FileReport> {
  const report: FileReport = { filesCreated: [], filesUpdated: [], filesSkipped: [] }
  if (!files.length) return report
  const filesSpinner = spinner('Updating files.', { silent: options.silent }).start()
  const relative = (file: string) => path.relative(config.resolvedPaths.cwd, file)

  for (const file of files) {
    const filePath = resolveFilePath(file, config)
    const existingFile = existsSync(filePath)
    if (existingFile && statSync(filePath).isDirectory()) throw new Error(`Cannot write to ${filePath}: path exists and is a directory.`)

    const content = await installedContent(file, config, options.iconMap)

    if (existingFile && isContentSame(await fs.readFile(filePath, 'utf8'), content)) {
      report.filesSkipped.push(relative(filePath))
      continue
    }

    if (existingFile && !options.overwrite) {
      if (options.yes) {
        report.filesSkipped.push(relative(filePath))
        continue
      }
      filesSpinner.stop()
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `The file ${highlighter.info(relative(filePath))} already exists. Would you like to overwrite?`,
        initial: false,
      })
      if (!overwrite) {
        report.filesSkipped.push(relative(filePath))
        continue
      }
      filesSpinner.start()
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')
    ;(existingFile ? report.filesUpdated : report.filesCreated).push(relative(filePath))
  }

  filesSpinner.stop()
  if (!options.silent) {
    const list = (label: string, files: string[]) => {
      if (!files.length) return
      logger.info(`${label} ${files.length} ${files.length === 1 ? 'file' : 'files'}:`)
      for (const file of files) logger.log(`  - ${file}`)
    }
    list('Created', report.filesCreated)
    list('Updated', report.filesUpdated)
    list('Skipped', report.filesSkipped)
  }
  return report
}

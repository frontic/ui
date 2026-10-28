import { existsSync, promises as fs } from 'node:fs'
import { Command } from 'commander'
import { diffLines } from 'diff'
import path from 'pathe'
import { z } from 'zod'
import { installedFiles, printDiff } from '@/src/install'
import { fetchItems, getIndex, iconMap, type IndexEntry, type RegistryItem } from '@/src/registry'
import type { Config } from '@/src/schema'
import { getConfig } from '@/src/utils/get-config'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { installedContent, resolveFilePath } from '@/src/utils/updaters/update-files'

const FLAT_FOLDER: Partial<Record<IndexEntry['type'], string>> = { 'registry:lib': 'lib', 'registry:composable': 'composables' }

/** The index entries the project has: a ui item by its folder, a lib or composable item by its file. */
export function installedItems(index: Pick<IndexEntry, 'name' | 'type'>[], config: Config) {
  return index
    .filter(({ name, type }) => {
      if (type === 'registry:ui') return existsSync(path.join(config.resolvedPaths.ui, name))
      const folder = FLAT_FOLDER[type]
      return folder !== undefined && existsSync(resolveFilePath({ path: `${folder}/${name}.ts` }, config))
    })
    .map(({ name }) => name)
}

const diffOptionsSchema = z.object({ item: z.string().optional(), yes: z.boolean(), cwd: z.string() })

/** The installed files of an item that differ from what the registry serves now. */
export async function itemChanges(item: RegistryItem, config: Config, icons: Awaited<ReturnType<typeof iconMap>>) {
  const changes: { file: string; existing: string; content: string }[] = []
  for (const file of installedFiles(item)) {
    const target = resolveFilePath(file, config)
    if (!existsSync(target)) continue
    const existing = await fs.readFile(target, 'utf8')
    const content = await installedContent(file, config, icons)
    if (diffLines(content, existing).length > 1) changes.push({ file: path.relative(config.resolvedPaths.cwd, target), existing, content })
  }
  return changes
}

export const diff = new Command()
  .name('diff')
  .description('compare your installed files with what the registry serves now')
  .argument('[item]', 'the item name; nothing checks every installed item')
  .option('-y, --yes', 'skip confirmation prompt.', false)
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .action(async (item: string | undefined, opts) => {
    try {
      const options = diffOptionsSchema.parse({ item, ...opts, cwd: path.resolve(opts.cwd) })
      const config = await getConfig(options.cwd)
      if (!config) throw new Error(`No components.json at ${options.cwd}. Run ${highlighter.info('npx @frontic/ui init')} first.`)
      const icons = await iconMap()

      if (!options.item) {
        const names = installedItems(await getIndex(), config)
        const changed: { name: string; files: string[] }[] = []
        for (const registryItem of await fetchItems(names)) {
          const changes = await itemChanges(registryItem, config, icons)
          if (changes.length) changed.push({ name: registryItem.name, files: changes.map((change) => change.file) })
        }
        if (!changed.length) {
          logger.info('No updates found.')
          return
        }
        logger.info('The following items have updates available:')
        for (const entry of changed) {
          logger.info(`- ${entry.name}`)
          for (const file of entry.files) logger.info(`  - ${file}`)
        }
        logger.break()
        logger.info(`Run ${highlighter.success('diff <item>')} to see the changes.`)
        return
      }

      const [registryItem] = await fetchItems([options.item])
      const changes = await itemChanges(registryItem!, config, icons)
      if (!changes.length) {
        logger.info(`No updates found for ${options.item}.`)
        return
      }
      for (const change of changes) printDiff(change.file, change.content, change.existing)
      logger.break()
    } catch (error) {
      handleError(error)
    }
  })

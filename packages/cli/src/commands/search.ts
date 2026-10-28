import { Command } from 'commander'
import { z } from 'zod'
import { TIER_NAMES, TIERS, tierOf } from '@frontic/registry-client/api'
import { search as searchRegistry, type IndexEntry } from '@/src/registry'
import { handleError } from '@/src/utils/handle-error'
import { logger } from '@/src/utils/logger'

const searchOptionsSchema = z.object({
  query: z.string().default(''),
  tier: z.enum(TIER_NAMES).optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  json: z.boolean(),
})

/** The index entries as a table: name, tier, title or description. */
export function searchTable(items: IndexEntry[]) {
  const rows = items.map((item) => [item.name, tierOf(item.type) ?? item.type, item.title && item.description ? `${item.title}: ${item.description}` : item.title || item.description || ''])
  const widths = [0, 1].map((column) => Math.max(...rows.map((row) => row[column]!.length), 0))
  return rows.map((row) => `${row[0]!.padEnd(widths[0]!)}  ${row[1]!.padEnd(widths[1]!)}  ${row[2]}`).join('\n')
}

export const search = new Command()
  .name('search')
  .description('search items by name and description')
  .argument('[query]', 'what to look for; nothing lists every item')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('--tier <tier>', 'ui, sections, templates, lib or composables')
  .option('--limit <n>', 'how many items to show')
  .option('--offset <n>', 'how many items to skip')
  .option('--json', 'output as JSON.', false)
  .action(async (query: string | undefined, opts) => {
    try {
      const options = searchOptionsSchema.parse({ ...opts, query })
      const results = await searchRegistry(options.query, { type: options.tier ? TIERS[options.tier] : undefined, limit: options.limit, offset: options.offset })
      if (options.json) {
        process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
        return
      }
      if (!results.items.length) {
        logger.info('No items found.')
        return
      }
      logger.log(searchTable(results.items))
      if (results.pagination.hasMore) logger.info(`${results.pagination.total - results.pagination.offset - results.items.length} more; use --offset and --limit.`)
    } catch (error) {
      handleError(error)
    }
  })

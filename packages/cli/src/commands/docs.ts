import { exampleDeps, itemMarkdown } from '@frontic/registry-client'
import { Command } from 'commander'
import { fetchItems, registryOptions } from '@/src/registry'
import { handleError } from '@/src/utils/handle-error'

export const docs = new Command()
  .name('docs')
  .description("print an item's docs: install command, examples, anatomy, API, exports, styling and source")
  .argument('<items...>', 'item names')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .action(async (items: string[]) => {
    try {
      const records = await fetchItems(items)
      const texts = await Promise.all(records.map(async (item) => itemMarkdown(item, { deps: await exampleDeps(item, registryOptions()) }).trimEnd()))
      process.stdout.write(`${texts.join('\n\n')}\n`)
    } catch (error) {
      handleError(error)
    }
  })

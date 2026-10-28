import { Command } from 'commander'
import { fetchItems } from '@/src/registry'
import { handleError } from '@/src/utils/handle-error'

export const view = new Command()
  .name('view')
  .description("print items' registry records as JSON: files, dependencies, recipes and API")
  .argument('<items...>', 'item names')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .action(async (items: string[]) => {
    try {
      process.stdout.write(`${JSON.stringify(await fetchItems(items), null, 2)}\n`)
    } catch (error) {
      handleError(error)
    }
  })

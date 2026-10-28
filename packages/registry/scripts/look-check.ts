// Every served item's resolved look against its snapshot in look/<item>.txt: `pnpm look [item…] [--write]`.
// An intended change is rewritten with --write and read as a diff in review; blind spots are in the registry README.
import { join } from 'node:path'
import { lookVerdict } from './lib/snapshot-run'

const root = join(import.meta.dirname, '..')
const args = process.argv.slice(2)
const write = args.includes('--write')
const items = args.filter((a) => !a.startsWith('--'))
const { changed, missing, stale } = await lookVerdict(root, items, write)

for (const { item, removed, added } of changed) {
  console.log(`\n${item}:`)
  for (const line of removed) console.log(`- ${line}`)
  for (const line of added) console.log(`+ ${line}`)
}
for (const item of missing) console.log(`\nmissing snapshot: look/${item}.txt (run look --write ${item})`)
for (const item of stale) console.log(`\nstale snapshot: look/${item}.txt has no served item`)
const failed = changed.length + missing.length + stale.length
console.log(write ? '\nlook: snapshots written' : `\nlook: ${failed ? `${changed.length} changed, ${missing.length} missing, ${stale.length} stale` : 'every item matches its snapshot'}`)
if (failed) process.exitCode = 1
